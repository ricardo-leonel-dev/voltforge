use sqlx::PgPool;
use crate::{error::AppError, models::user::{User, UserPublic}};

pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, AppError> {
    sqlx::query_as!(
        User,
        "SELECT id, org_id, email, name, password_hash, role, avatar_url, created_at
         FROM users WHERE email = $1",
        email
    )
    .fetch_optional(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn find_by_id_full(pool: &PgPool, id: i32) -> Result<Option<User>, AppError> {
    sqlx::query_as!(
        User,
        "SELECT id, org_id, email, name, password_hash, role, avatar_url, created_at
         FROM users WHERE id = $1",
        id
    )
    .fetch_optional(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn create(
    pool: &PgPool,
    org_id: i32,
    email: &str,
    name: &str,
    password_hash: &str,
    role: &str,
) -> Result<UserPublic, AppError> {
    sqlx::query_as!(
        UserPublic,
        "INSERT INTO users (org_id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, org_id, email, name, role, avatar_url, created_at",
        org_id, email, name, password_hash, role
    )
    .fetch_one(pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(db_err) if db_err.constraint() == Some("users_email_key") => {
            AppError::Conflict("El email ya está registrado".to_string())
        }
        other => AppError::Database(other),
    })
}

pub async fn find_public_by_id(pool: &PgPool, id: i32) -> Result<Option<UserPublic>, AppError> {
    sqlx::query_as!(
        UserPublic,
        "SELECT id, org_id, email, name, role, avatar_url, created_at FROM users WHERE id = $1",
        id
    )
    .fetch_optional(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn update_user(
    pool: &PgPool,
    id: i32,
    name: Option<&str>,
    email: Option<&str>,
    password_hash: Option<&str>,
    avatar_url: Option<&str>,
) -> Result<UserPublic, AppError> {
    sqlx::query_as!(
        UserPublic,
        r#"UPDATE users SET
            name = COALESCE($2, name),
            email = COALESCE($3, email),
            password_hash = COALESCE($4, password_hash),
            avatar_url = COALESCE($5, avatar_url)
           WHERE id = $1
           RETURNING id, org_id, email, name, role, avatar_url, created_at"#,
        id, name, email, password_hash, avatar_url
    )
    .fetch_one(pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(db_err) if db_err.constraint() == Some("users_email_key") => {
            AppError::Conflict("El email ya está en uso".to_string())
        }
        other => AppError::Database(other),
    })
}

pub async fn list_all(pool: &PgPool) -> Result<Vec<UserPublic>, AppError> {
    sqlx::query_as!(
        UserPublic,
        "SELECT id, org_id, email, name, role, avatar_url, created_at FROM users ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn list_for_org(pool: &PgPool, org_id: i32) -> Result<Vec<UserPublic>, AppError> {
    sqlx::query_as!(
        UserPublic,
        "SELECT id, org_id, email, name, role, avatar_url, created_at
         FROM users WHERE org_id = $1 ORDER BY created_at DESC",
        org_id
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
}
