use sqlx::PgPool;
use crate::{error::AppError, models::organization::Organization};

pub async fn create(pool: &PgPool, name: &str) -> Result<Organization, AppError> {
    sqlx::query_as!(
        Organization,
        "INSERT INTO organizations (name) VALUES ($1) RETURNING id, name, created_at",
        name
    )
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn find_by_id(pool: &PgPool, id: i32) -> Result<Option<Organization>, AppError> {
    sqlx::query_as!(
        Organization,
        "SELECT id, name, created_at FROM organizations WHERE id = $1",
        id
    )
    .fetch_optional(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn list_all(pool: &PgPool) -> Result<Vec<Organization>, AppError> {
    sqlx::query_as!(
        Organization,
        "SELECT id, name, created_at FROM organizations ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
}
