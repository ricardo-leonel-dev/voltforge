use sqlx::PgPool;
use crate::{error::AppError, models::subscription::Subscription};

pub async fn create(pool: &PgPool, org_id: i32, plan: &str) -> Result<Subscription, AppError> {
    sqlx::query_as!(
        Subscription,
        "INSERT INTO subscriptions (org_id, plan, status)
         VALUES ($1, $2, 'active')
         RETURNING id, org_id, plan, status, activated_by, stripe_customer_id, expires_at,
                   program_code, created_at, updated_at",
        org_id, plan
    )
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn get_active_for_org(pool: &PgPool, org_id: i32) -> Result<Option<Subscription>, AppError> {
    sqlx::query_as!(
        Subscription,
        "SELECT id, org_id, plan, status, activated_by, stripe_customer_id, expires_at,
                program_code, created_at, updated_at
         FROM subscriptions
         WHERE org_id = $1 AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1",
        org_id
    )
    .fetch_optional(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn update(
    pool: &PgPool,
    id: i32,
    plan: &str,
    status: &str,
    program_code: Option<&str>,
    activated_by: Option<i32>,
) -> Result<Subscription, AppError> {
    sqlx::query_as!(
        Subscription,
        "UPDATE subscriptions
         SET plan = $2, status = $3, program_code = $4, activated_by = $5, updated_at = NOW()
         WHERE id = $1
         RETURNING id, org_id, plan, status, activated_by, stripe_customer_id, expires_at,
                   program_code, created_at, updated_at",
        id, plan, status, program_code, activated_by
    )
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn list_all(pool: &PgPool) -> Result<Vec<Subscription>, AppError> {
    sqlx::query_as!(
        Subscription,
        "SELECT id, org_id, plan, status, activated_by, stripe_customer_id, expires_at,
                program_code, created_at, updated_at
         FROM subscriptions
         ORDER BY updated_at DESC"
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
}
