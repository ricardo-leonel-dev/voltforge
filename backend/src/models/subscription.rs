use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Subscription {
    pub id: i32,
    pub org_id: i32,
    pub plan: String,
    pub status: String,
    pub activated_by: Option<i32>,
    pub stripe_customer_id: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub program_code: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSubscriptionRequest {
    pub plan: String,
    pub status: String,
    pub program_code: Option<String>,
}
