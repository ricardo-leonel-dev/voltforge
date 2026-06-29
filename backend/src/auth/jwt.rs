use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: i32,       // user_id
    pub org_id: i32,
    pub role: String,   // "user" | "admin" | "superadmin"
    pub exp: i64,
    pub iat: i64,
}

pub fn create_token(user_id: i32, org_id: i32, role: &str, secret: &str) -> Result<String, AppError> {
    let now = Utc::now();
    let claims = Claims {
        sub: user_id,
        org_id,
        role: role.to_string(),
        iat: now.timestamp(),
        exp: (now + Duration::days(7)).timestamp(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("Error al crear token: {e}")))
}

pub fn validate_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized("Token inválido o expirado".to_string()))
}
