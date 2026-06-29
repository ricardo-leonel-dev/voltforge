use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("No autorizado: {0}")]
    Unauthorized(String),

    #[error("Acceso denegado: {0}")]
    Forbidden(String),

    #[error("No encontrado: {0}")]
    NotFound(String),

    #[error("Conflicto: {0}")]
    Conflict(String),

    #[error("Límite alcanzado: {0}")]
    LimitExceeded(String),

    #[error("Validación: {0}")]
    Validation(String),

    #[error("Error de base de datos")]
    Database(#[from] sqlx::Error),

    #[error("Error interno: {0}")]
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_code, message) = match &self {
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", msg.as_str()),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, "FORBIDDEN", msg.as_str()),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg.as_str()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, "CONFLICT", msg.as_str()),
            AppError::LimitExceeded(msg) => (StatusCode::TOO_MANY_REQUESTS, "LIMIT_EXCEEDED", msg.as_str()),
            AppError::Validation(msg) => (StatusCode::UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", msg.as_str()),
            AppError::Database(e) => {
                tracing::error!("Database error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR", "Error de base de datos")
            }
            AppError::Internal(msg) => {
                tracing::error!("Internal error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", msg.as_str())
            }
        };

        let body = Json(json!({
            "error": error_code,
            "message": message,
        }));

        (status, body).into_response()
    }
}
