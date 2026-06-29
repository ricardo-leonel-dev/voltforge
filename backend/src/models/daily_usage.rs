use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct DailyUsage {
    pub id: i32,
    pub user_id: i32,
    pub org_id: i32,
    pub usage_date: NaiveDate,
    pub template_count: i32,
}
