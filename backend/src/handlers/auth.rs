use axum::{extract::State, Json};
use validator::Validate;
use crate::{
    auth::{jwt::{create_token, Claims}, password},
    db::users,
    error::AppError,
    models::user::{AuthResponse, LoginRequest, RegisterRequest},
    state::AppState,
};

pub async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    req.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    // Verificar email único
    if users::find_by_email(&state.db, &req.email).await?.is_some() {
        return Err(AppError::Conflict("El email ya está registrado".to_string()));
    }

    let org_name = req.org_name
        .as_deref()
        .filter(|s| !s.trim().is_empty())
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("{} personal organization", req.name));

    let password_hash = password::hash(&req.password)?;

    // TX: crear org + usuario + suscripción
    let mut tx = state.db.begin().await.map_err(AppError::Database)?;

    let org = sqlx::query_as!(
        crate::models::organization::Organization,
        "INSERT INTO organizations (name) VALUES ($1) RETURNING id, name, created_at",
        org_name
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    let user = sqlx::query_as!(
        crate::models::user::UserPublic,
        "INSERT INTO users (org_id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, 'user')
         RETURNING id, org_id, email, name, role, created_at",
        org.id, req.email, req.name, password_hash
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    sqlx::query!(
        "INSERT INTO subscriptions (org_id, plan, status) VALUES ($1, 'free', 'active')",
        org.id
    )
    .execute(&mut *tx)
    .await
    .map_err(AppError::Database)?;

    tx.commit().await.map_err(AppError::Database)?;

    let token = create_token(user.id, user.org_id, &user.role, &state.config.jwt_secret)?;

    Ok(Json(AuthResponse { token, user }))
}

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    req.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let user = users::find_by_email(&state.db, &req.email)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Credenciales incorrectas".to_string()))?;

    let valid = password::verify(&req.password, &user.password_hash)?;
    if !valid {
        return Err(AppError::Unauthorized("Credenciales incorrectas".to_string()));
    }

    let token = create_token(user.id, user.org_id, &user.role, &state.config.jwt_secret)?;

    let user_public = crate::models::user::UserPublic {
        id: user.id,
        org_id: user.org_id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
    };

    Ok(Json(AuthResponse { token, user: user_public }))
}

pub async fn me(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<crate::models::user::UserPublic>, AppError> {
    let user = users::find_public_by_id(&state.db, claims.sub)
        .await?
        .ok_or_else(|| AppError::NotFound("Usuario no encontrado".to_string()))?;
    Ok(Json(user))
}
