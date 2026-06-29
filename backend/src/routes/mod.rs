use axum::{routing::{get, patch, post}, Router};
use crate::{handlers, state::AppState};

pub fn auth_router() -> Router<AppState> {
    Router::new()
        .route("/register", post(handlers::auth::register))
        .route("/login", post(handlers::auth::login))
        .route("/me", get(handlers::auth::me))
}

pub fn conductors_router() -> Router<AppState> {
    Router::new()
        .route("/", get(handlers::conductors::list))
}

pub fn calculations_router() -> Router<AppState> {
    Router::new()
        .route("/", post(handlers::calculations::create))
        .route("/", get(handlers::calculations::list))
        .route("/:id", get(handlers::calculations::get_one))
        .route("/:id/download", post(handlers::calculations::download))
}

pub fn subscription_router() -> Router<AppState> {
    Router::new()
        .route("/", get(handlers::subscription::get_status))
}

pub fn admin_router() -> Router<AppState> {
    Router::new()
        .route("/users", get(handlers::admin::list_users))
        .route("/organizations", get(handlers::admin::list_organizations))
        .route("/subscriptions", get(handlers::admin::list_subscriptions))
        .route("/subscriptions/:id", patch(handlers::admin::update_subscription))
}
