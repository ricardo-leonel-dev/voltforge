use axum::{extract::State, Json};
use serde::Serialize;
use crate::{
    auth::jwt::Claims,
    db::{daily_usage, subscriptions},
    error::AppError,
    models::{daily_usage::DailyUsage, subscription::Subscription},
    state::AppState,
};

#[derive(Serialize)]
pub struct SubscriptionStatus {
    pub subscription: Option<Subscription>,
    pub daily_usage: Option<DailyUsage>,
    pub free_limit: i32,
}

pub async fn get_status(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<SubscriptionStatus>, AppError> {
    let subscription = subscriptions::get_active_for_org(&state.db, claims.org_id).await?;
    let usage = daily_usage::get_today_for_user(&state.db, claims.sub).await?;

    Ok(Json(SubscriptionStatus {
        subscription,
        daily_usage: usage,
        free_limit: 2,
    }))
}
