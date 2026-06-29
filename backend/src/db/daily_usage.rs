use chrono::Utc;
use sqlx::{PgPool, Postgres, Transaction};
use crate::{error::AppError, models::daily_usage::DailyUsage};

pub async fn get_or_create_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    user_id: i32,
    org_id: i32,
) -> Result<DailyUsage, AppError> {
    let today = Utc::now().date_naive();
    sqlx::query_as!(
        DailyUsage,
        "INSERT INTO daily_usage (user_id, org_id, usage_date, template_count)
         VALUES ($1, $2, $3, 0)
         ON CONFLICT (user_id, usage_date) DO UPDATE SET template_count = daily_usage.template_count
         RETURNING id, user_id, org_id, usage_date, template_count",
        user_id, org_id, today
    )
    .fetch_one(&mut **tx)
    .await
    .map_err(AppError::Database)
}

pub async fn increment_in_tx(
    tx: &mut Transaction<'_, Postgres>,
    id: i32,
) -> Result<(), AppError> {
    sqlx::query!(
        "UPDATE daily_usage SET template_count = template_count + 1 WHERE id = $1",
        id
    )
    .execute(&mut **tx)
    .await
    .map_err(AppError::Database)?;
    Ok(())
}

pub async fn get_today_for_user(pool: &PgPool, user_id: i32) -> Result<Option<DailyUsage>, AppError> {
    let today = Utc::now().date_naive();
    sqlx::query_as!(
        DailyUsage,
        "SELECT id, user_id, org_id, usage_date, template_count
         FROM daily_usage
         WHERE user_id = $1 AND usage_date = $2",
        user_id, today
    )
    .fetch_optional(pool)
    .await
    .map_err(AppError::Database)
}
