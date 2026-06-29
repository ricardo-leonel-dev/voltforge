use chrono::{Datelike, NaiveDate, Utc};
use sqlx::PgPool;
use crate::{error::AppError, models::weekly_usage::WeeklyUsage};

pub fn current_week_start() -> NaiveDate {
    let today = Utc::now().date_naive();
    // Lunes de la semana actual
    let days_since_monday = today.weekday().num_days_from_monday();
    today - chrono::Duration::days(days_since_monday as i64)
}

pub async fn get_or_create(
    pool: &PgPool,
    user_id: i32,
    org_id: i32,
    week_start: NaiveDate,
) -> Result<WeeklyUsage, AppError> {
    sqlx::query_as!(
        WeeklyUsage,
        "INSERT INTO weekly_usage (user_id, org_id, week_start, template_count)
         VALUES ($1, $2, $3, 0)
         ON CONFLICT (user_id, week_start) DO UPDATE SET template_count = weekly_usage.template_count
         RETURNING id, user_id, org_id, week_start, template_count",
        user_id, org_id, week_start
    )
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn increment(pool: &PgPool, id: i32) -> Result<WeeklyUsage, AppError> {
    sqlx::query_as!(
        WeeklyUsage,
        "UPDATE weekly_usage SET template_count = template_count + 1 WHERE id = $1
         RETURNING id, user_id, org_id, week_start, template_count",
        id
    )
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn get_current_for_user(
    pool: &PgPool,
    user_id: i32,
) -> Result<Option<WeeklyUsage>, AppError> {
    let week_start = current_week_start();
    sqlx::query_as!(
        WeeklyUsage,
        "SELECT id, user_id, org_id, week_start, template_count
         FROM weekly_usage
         WHERE user_id = $1 AND week_start = $2",
        user_id, week_start
    )
    .fetch_optional(pool)
    .await
    .map_err(AppError::Database)
}
