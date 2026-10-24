import "dotenv/config";

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",

  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  paystackWebhookUrl: process.env.PAYSTACK_WEBHOOK_URL,

  staffSecretKey: process.env.STAFF_SECRET_KEY || "brightsmile-staff-demo-key",

  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};
