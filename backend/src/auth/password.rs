use crate::error::AppError;

pub fn hash(password: &str) -> Result<String, AppError> {
    bcrypt::hash(password, 12)
        .map_err(|e| AppError::Internal(format!("Error al hashear contraseña: {e}")))
}

pub fn verify(password: &str, hash: &str) -> Result<bool, AppError> {
    bcrypt::verify(password, hash)
        .map_err(|e| AppError::Internal(format!("Error al verificar contraseña: {e}")))
}
