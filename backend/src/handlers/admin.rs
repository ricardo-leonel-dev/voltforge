use axum::{
    extract::{Path, State},
    Json,
};
use crate::{
    auth::extractor::AdminClaims,
    db::{organizations, subscriptions, users},
    error::AppError,
    models::{
        organization::Organization,
        subscription::{Subscription, UpdateSubscriptionRequest},
        user::UserPublic,
    },
    state::AppState,
};

pub async fn list_users(
    State(state): State<AppState>,
    _: AdminClaims,
) -> Result<Json<Vec<UserPublic>>, AppError> {
    let users = users::list_all(&state.db).await?;
    Ok(Json(users))
}

pub async fn list_organizations(
    State(state): State<AppState>,
    _: AdminClaims,
) -> Result<Json<Vec<Organization>>, AppError> {
    let orgs = organizations::list_all(&state.db).await?;
    Ok(Json(orgs))
}

pub async fn list_subscriptions(
    State(state): State<AppState>,
    _: AdminClaims,
) -> Result<Json<Vec<Subscription>>, AppError> {
    let subs = subscriptions::list_all(&state.db).await?;
    Ok(Json(subs))
}

pub async fn update_subscription(
    State(state): State<AppState>,
    AdminClaims(claims): AdminClaims,
    Path(id): Path<i32>,
    Json(req): Json<UpdateSubscriptionRequest>,
) -> Result<Json<Subscription>, AppError> {
    let sub = subscriptions::update(
        &state.db,
        id,
        &req.plan,
        &req.status,
        req.program_code.as_deref(),
        Some(claims.sub),
    ).await?;
    Ok(Json(sub))
}
