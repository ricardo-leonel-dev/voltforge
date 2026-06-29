mod auth;
mod config;
mod db;
mod error;
mod handlers;
mod models;
mod routes;
mod state;
mod templates;

use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use axum::Router;

use config::Config;
use routes::{admin_router, auth_router, calculations_router, conductors_router, subscription_router};
use state::AppState;
use templates::{digsilent::DigsilentGenerator, TemplateGenerator};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("backend=info".parse()?)
                .add_directive("sqlx=warn".parse()?),
        )
        .init();

    let config = Arc::new(Config::from_env());

    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&config.database_url)
        .await?;

    tracing::info!("Aplicando migraciones...");
    sqlx::migrate!("./migrations").run(&pool).await?;
    tracing::info!("Migraciones completadas.");

    // Registrar generadores de plantillas
    let mut generators: HashMap<String, Arc<dyn TemplateGenerator>> = HashMap::new();
    generators.insert("digsilent".to_string(), Arc::new(DigsilentGenerator));

    let state = AppState {
        db: pool,
        config: config.clone(),
        generators: Arc::new(generators),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .nest("/api/auth", auth_router())
        .nest("/api/conductors", conductors_router())
        .nest("/api/calculations", calculations_router())
        .nest("/api/subscription", subscription_router())
        .nest("/api/admin", admin_router())
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr: SocketAddr = format!("{}:{}", config.host, config.port).parse()?;
    tracing::info!("Servidor escuchando en http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
