use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, HeaderMap},
};
use crate::{auth::jwt::{validate_token, Claims}, error::AppError, state::AppState};

fn extract_bearer(headers: &HeaderMap) -> Option<&str> {
    headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
}

#[async_trait]
impl FromRequestParts<AppState> for Claims {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let token = extract_bearer(&parts.headers)
            .ok_or_else(|| AppError::Unauthorized("Token no proporcionado".to_string()))?;

        validate_token(token, &state.config.jwt_secret)
    }
}

/// Extractor que solo permite superadmin
pub struct AdminClaims(pub Claims);

#[async_trait]
impl FromRequestParts<AppState> for AdminClaims {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let claims = Claims::from_request_parts(parts, state).await?;
        if claims.role != "superadmin" {
            return Err(AppError::Forbidden("Se requiere rol superadmin".to_string()));
        }
        Ok(AdminClaims(claims))
    }
}
