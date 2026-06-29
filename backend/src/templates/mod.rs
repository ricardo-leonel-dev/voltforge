pub mod digsilent;

use serde_json::Value;
use crate::models::{conductor::ConductorType, calculation::CalcInput};

pub struct TemplateOutput {
    pub data: Value,
    pub text: String,
    pub html: String,
}

pub trait TemplateGenerator: Send + Sync {
    fn program_code(&self) -> &str;
    fn generate(&self, input: &CalcInput, conductor: &ConductorType, html_template: &str) -> TemplateOutput;
}
