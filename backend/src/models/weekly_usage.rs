use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct WeeklyUsage {
    pub id: i32,
    pub user_id: i32,
    pub org_id: i32,
    pub week_start: NaiveDate,
    pub template_count: i32,
}
