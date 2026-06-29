use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Calculation {
    pub id: i32,
    pub user_id: i32,
    pub org_id: i32,
    pub inputs: Value,
    pub template_program_id: i32,
    pub result_data: Option<Value>,
    pub result_text: Option<String>,
    pub result_html: Option<String>,
    pub download_count: i32,
    pub parent_calc_id: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Validate, Clone)]
pub struct CalcInput {
    #[validate(length(min = 1, message = "Nombre del cálculo requerido"))]
    pub nombre: String,

    pub descripcion: Option<String>,

    #[validate(length(min = 1, message = "Subtipo requerido"))]
    pub subtipo: String,

    #[validate(length(min = 1, message = "Fase de conexión requerida"))]
    pub fase_conexion: String,

    #[validate(range(min = 0.001, message = "Voltaje debe ser mayor que 0"))]
    pub voltaje_kv: f64,

    #[validate(length(min = 1, message = "Código de conductor requerido"))]
    pub conductor_code: String,

    #[validate(length(min = 1, message = "Configuración requerida"))]
    pub configuracion: String,

    #[validate(length(min = 1, message = "Circuito requerido"))]
    pub circuito: String,

    #[validate(length(min = 1, message = "Tipo de uso requerido"))]
    pub tipo_uso: String,

    #[validate(length(min = 1, message = "Circuitos requerido"))]
    pub circuitos: String,

    #[validate(range(min = 0.01, message = "Distancia debe ser mayor que 0"))]
    pub distancia_m: f64,

    #[validate(length(min = 1, message = "Programa de plantilla requerido"))]
    pub template_program_code: String,
}

#[derive(Debug, Serialize)]
pub struct CalcResponse {
    pub id: Option<i32>,
    pub inputs: Value,
    pub result_data: Option<Value>,
    pub result_text: Option<String>,
    pub result_html: Option<String>,
    pub download_count: i32,
    pub template_program_id: i32,
    pub created_at: DateTime<Utc>,
}

impl From<Calculation> for CalcResponse {
    fn from(c: Calculation) -> Self {
        Self {
            id: Some(c.id),
            inputs: c.inputs,
            result_data: c.result_data,
            result_text: c.result_text,
            result_html: c.result_html,
            download_count: c.download_count,
            template_program_id: c.template_program_id,
            created_at: c.created_at,
        }
    }
}
