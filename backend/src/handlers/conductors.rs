use axum::{extract::State, Json};
use crate::{db::conductors, error::AppError, models::conductor::ConductorType, state::AppState};

pub async fn list(
    State(state): State<AppState>,
) -> Result<Json<Vec<ConductorType>>, AppError> {
    let conductors = conductors::list_active(&state.db).await?;
    Ok(Json(conductors))
}
