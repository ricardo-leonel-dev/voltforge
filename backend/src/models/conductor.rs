use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct ConductorType {
    pub id: i32,
    pub code: String,
    pub display_name: String,
    pub material: String,
    pub line_type: String,
    pub r_ohm_km: f64,
    pub x_ohm_km: f64,
    pub rn_ohm_km: f64,
    pub xn_ohm_km: f64,
    pub rpn_ohm_km: f64,
    pub xpn_ohm_km: f64,
    pub b_us_km: f64,
    pub b0_us_km: f64,
    pub bn_us_km: f64,
    pub bpn_us_km: f64,
    pub i_ground_ka: f64,
    pub i_air_ka: f64,
    pub active: bool,
    pub created_at: DateTime<Utc>,
}
