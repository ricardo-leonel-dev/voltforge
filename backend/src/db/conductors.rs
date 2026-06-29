use sqlx::PgPool;
use crate::{error::AppError, models::conductor::ConductorType};

pub async fn list_active(pool: &PgPool) -> Result<Vec<ConductorType>, AppError> {
    sqlx::query_as!(
        ConductorType,
        "SELECT id, code, display_name, material, line_type,
                r_ohm_km, x_ohm_km, rn_ohm_km, xn_ohm_km,
                rpn_ohm_km, xpn_ohm_km, b_us_km, b0_us_km,
                bn_us_km, bpn_us_km, i_ground_ka, i_air_ka,
                active, created_at
         FROM conductor_types
         WHERE active = TRUE
         ORDER BY code"
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn find_by_code(pool: &PgPool, code: &str) -> Result<Option<ConductorType>, AppError> {
    sqlx::query_as!(
        ConductorType,
        "SELECT id, code, display_name, material, line_type,
                r_ohm_km, x_ohm_km, rn_ohm_km, xn_ohm_km,
                rpn_ohm_km, xpn_ohm_km, b_us_km, b0_us_km,
                bn_us_km, bpn_us_km, i_ground_ka, i_air_ka,
                active, created_at
         FROM conductor_types
         WHERE code = $1 AND active = TRUE",
        code
    )
    .fetch_optional(pool)
    .await
    .map_err(AppError::Database)
}
