use axum::{
    extract::{Path, Query, State},
    Json,
};
use chrono::Utc;
use serde::Deserialize;
use serde_json::json;
use validator::Validate;
use crate::{
    auth::jwt::Claims,
    db::{calculations, conductors, daily_usage, subscriptions},
    error::AppError,
    models::calculation::{CalcInput, CalcResponse},
    state::AppState,
};

#[derive(Deserialize)]
pub struct Pagination {
    pub page: Option<i64>,
}

pub async fn create(
    State(state): State<AppState>,
    claims: Claims,
    Json(input): Json<CalcInput>,
) -> Result<Json<CalcResponse>, AppError> {
    input.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let conductor = conductors::find_by_code(&state.db, &input.conductor_code)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Conductor '{}' no encontrado", input.conductor_code)))?;

    let subscription = subscriptions::get_active_for_org(&state.db, claims.org_id)
        .await?
        .ok_or_else(|| AppError::Forbidden("Sin suscripción activa".to_string()))?;

    let program = sqlx::query!(
        "SELECT id, code, html_template FROM template_programs WHERE code = $1 AND active = TRUE",
        input.template_program_code
    )
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound(format!("Programa '{}' no soportado", input.template_program_code)))?;

    let generator = state.generators.get(&program.code)
        .ok_or_else(|| AppError::Internal(format!("Generador '{}' no registrado", program.code)))?;

    let html_template = program.html_template.as_deref().unwrap_or("");

    match subscription.plan.as_str() {
        "free" => {
            let mut tx = state.db.begin().await.map_err(AppError::Database)?;

            let usage = daily_usage::get_or_create_in_tx(&mut tx, claims.sub, claims.org_id).await?;

            if usage.template_count >= 2 {
                tx.rollback().await.map_err(AppError::Database)?;
                return Err(AppError::LimitExceeded(
                    "Has alcanzado el límite de 2 plantillas diarias del plan gratuito. Actualiza a un plan superior para continuar.".to_string()
                ));
            }

            daily_usage::increment_in_tx(&mut tx, usage.id).await?;
            tx.commit().await.map_err(AppError::Database)?;

            // Free: generate but don't save, no result_html
            let output = generator.generate(&input, &conductor, html_template);
            let inputs_json = serde_json::to_value(&input)
                .map_err(|e| AppError::Internal(e.to_string()))?;

            Ok(Json(CalcResponse {
                id: None,
                inputs: inputs_json,
                result_data: Some(output.data),
                result_text: Some(output.text),
                result_html: None,
                download_count: 0,
                template_program_id: program.id,
                created_at: Utc::now(),
            }))
        }

        "basico" => {
            let allowed_program = subscription.program_code.as_deref().unwrap_or("digsilent");
            if input.template_program_code != allowed_program {
                return Err(AppError::Forbidden(format!(
                    "El plan Básico solo permite el programa '{}'. Actualiza a Pro para usar múltiples programas.",
                    allowed_program
                )));
            }

            let output = generator.generate(&input, &conductor, html_template);
            let inputs_json = serde_json::to_value(&input)
                .map_err(|e| AppError::Internal(e.to_string()))?;

            // Purge calculations older than 1 month for this user
            calculations::delete_older_than_one_month(&state.db, claims.sub, claims.org_id).await?;

            let calc = sqlx::query_as!(
                crate::models::calculation::Calculation,
                "INSERT INTO calculations (user_id, org_id, inputs, template_program_id, result_data, result_text, result_html)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, user_id, org_id, inputs, template_program_id, result_data, result_text,
                           result_html, download_count, parent_calc_id, created_at",
                claims.sub, claims.org_id, inputs_json, program.id,
                output.data, output.text, output.html
            )
            .fetch_one(&state.db)
            .await
            .map_err(AppError::Database)?;

            Ok(Json(CalcResponse::from(calc)))
        }

        "pro" | _ => {
            let output = generator.generate(&input, &conductor, html_template);
            let inputs_json = serde_json::to_value(&input)
                .map_err(|e| AppError::Internal(e.to_string()))?;

            let calc = sqlx::query_as!(
                crate::models::calculation::Calculation,
                "INSERT INTO calculations (user_id, org_id, inputs, template_program_id, result_data, result_text, result_html)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, user_id, org_id, inputs, template_program_id, result_data, result_text,
                           result_html, download_count, parent_calc_id, created_at",
                claims.sub, claims.org_id, inputs_json, program.id,
                output.data, output.text, output.html
            )
            .fetch_one(&state.db)
            .await
            .map_err(AppError::Database)?;

            Ok(Json(CalcResponse::from(calc)))
        }
    }
}

pub async fn list(
    State(state): State<AppState>,
    claims: Claims,
    Query(params): Query<Pagination>,
) -> Result<Json<Vec<CalcResponse>>, AppError> {
    let subscription = subscriptions::get_active_for_org(&state.db, claims.org_id).await?;
    let plan = subscription.map(|s| s.plan).unwrap_or_default();

    if plan == "free" {
        return Ok(Json(vec![]));
    }

    let page = params.page.unwrap_or(1).max(1);
    let limit = 20i64;
    let offset = (page - 1) * limit;

    let calcs = calculations::list_for_user(&state.db, claims.sub, claims.org_id, limit, offset).await?;
    Ok(Json(calcs.into_iter().map(CalcResponse::from).collect()))
}

pub async fn get_one(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<i32>,
) -> Result<Json<CalcResponse>, AppError> {
    let calc = calculations::find_by_id(&state.db, id, claims.sub, claims.org_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Cálculo no encontrado".to_string()))?;
    Ok(Json(CalcResponse::from(calc)))
}

pub async fn download(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<i32>,
) -> Result<Json<serde_json::Value>, AppError> {
    let calc = calculations::find_by_id(&state.db, id, claims.sub, claims.org_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Cálculo no encontrado".to_string()))?;

    let subscription = subscriptions::get_active_for_org(&state.db, claims.org_id)
        .await?
        .ok_or_else(|| AppError::Forbidden("Sin suscripción activa".to_string()))?;

    match subscription.plan.as_str() {
        "free" => {
            return Err(AppError::Forbidden("El plan gratuito no permite descargar plantillas.".to_string()));
        }
        "basico" => {
            if calc.download_count >= 5 {
                return Err(AppError::LimitExceeded(
                    "Has alcanzado el límite de 5 descargas para este cálculo.".to_string()
                ));
            }
        }
        _ => {} // pro: sin límite
    }

    let new_count = calculations::increment_download(&state.db, id).await?;
    Ok(Json(json!({ "download_count": new_count })))
}
