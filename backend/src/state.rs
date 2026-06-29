use std::{collections::HashMap, sync::Arc};
use sqlx::PgPool;
use crate::{config::Config, templates::TemplateGenerator};

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub config: Arc<Config>,
    pub generators: Arc<HashMap<String, Arc<dyn TemplateGenerator>>>,
}
