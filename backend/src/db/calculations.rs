use sqlx::PgPool;
use serde_json::Value;
use crate::{error::AppError, models::calculation::Calculation};

pub async fn list_for_user(
    pool: &PgPool,
    user_id: i32,
    org_id: i32,
    limit: i64,
    offset: i64,
) -> Result<Vec<Calculation>, AppError> {
    sqlx::query_as!(
        Calculation,
        "SELECT id, user_id, org_id, inputs, template_program_id, result_data, result_text,
                result_html, download_count, parent_calc_id, created_at
         FROM calculations
         WHERE user_id = $1 AND org_id = $2
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4",
        user_id, org_id, limit, offset
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn find_by_id(
    pool: &PgPool,
    id: i32,
    user_id: i32,
    org_id: i32,
) -> Result<Option<Calculation>, AppError> {
    sqlx::query_as!(
        Calculation,
        "SELECT id, user_id, org_id, inputs, template_program_id, result_data, result_text,
                result_html, download_count, parent_calc_id, created_at
         FROM calculations
         WHERE id = $1 AND user_id = $2 AND org_id = $3",
        id, user_id, org_id
    )
    .fetch_optional(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn increment_download(pool: &PgPool, id: i32) -> Result<i32, AppError> {
    let row = sqlx::query!(
        "UPDATE calculations SET download_count = download_count + 1 WHERE id = $1
         RETURNING download_count",
        id
    )
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)?;
    Ok(row.download_count)
}

pub async fn delete_older_than_one_month(pool: &PgPool, user_id: i32, org_id: i32) -> Result<(), AppError> {
    sqlx::query!(
        "DELETE FROM calculations
         WHERE user_id = $1 AND org_id = $2 AND created_at < NOW() - INTERVAL '1 month'",
        user_id, org_id
    )
    .execute(pool)
    .await
    .map_err(AppError::Database)?;
    Ok(())
}

pub async fn list_all(pool: &PgPool, limit: i64, offset: i64) -> Result<Vec<Calculation>, AppError> {
    sqlx::query_as!(
        Calculation,
        "SELECT id, user_id, org_id, inputs, template_program_id, result_data, result_text,
                result_html, download_count, parent_calc_id, created_at
         FROM calculations
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2",
        limit, offset
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
}
