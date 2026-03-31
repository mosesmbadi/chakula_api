/**
 * Database migration — creates all tables.
 * Run: npm run migrate
 */
const db = require('./db');

const UP = `
-- Enable PostGIS if available (for ST_Distance); gracefully skip if not installed
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PostGIS not available – falling back to Euclidean distance';
END $$;

-- Enable uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  phone         VARCHAR(30),
  location_id   UUID,
  region        VARCHAR(100),
  subregion     VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ─── Budget Settings (one per user, daily budget in local currency) ──

CREATE TABLE IF NOT EXISTS budget_settings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_budget        NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency            VARCHAR(10) NOT NULL DEFAULT 'KES',
  region_price_index  NUMERIC(6,3) NOT NULL DEFAULT 1.000,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Dietary Preferences ──────────────────────────────────

CREATE TABLE IF NOT EXISTS dietary_preferences (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preference  VARCHAR(100) NOT NULL,
  UNIQUE(user_id, preference)
);
CREATE INDEX IF NOT EXISTS idx_dietary_user ON dietary_preferences (user_id);

-- ─── Meal History ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS meal_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_id    UUID,
  meal_name  VARCHAR(255) NOT NULL,
  cost       NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency   VARCHAR(10) NOT NULL DEFAULT 'KES',
  rating     SMALLINT CHECK (rating BETWEEN 1 AND 5),
  notes      TEXT,
  eaten_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meal_history_user ON meal_history (user_id, eaten_at DESC);

-- ─── Feedback ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feedback (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_history_id UUID REFERENCES meal_history(id) ON DELETE SET NULL,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback (user_id, created_at DESC);

-- ─── Food Regions (Location Service) ─────────────────────

CREATE TABLE IF NOT EXISTS food_regions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  country       VARCHAR(100) NOT NULL,
  description   TEXT,
  cuisine_tags  TEXT[] DEFAULT '{}',
  center_lat    DOUBLE PRECISION NOT NULL DEFAULT 0,
  center_lng    DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_food_regions_country ON food_regions (country);

-- ─── Region Foods ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS region_foods (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id   UUID NOT NULL REFERENCES food_regions(id) ON DELETE CASCADE,
  food_name   VARCHAR(255) NOT NULL,
  description TEXT,
  avg_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency    VARCHAR(10) NOT NULL DEFAULT 'KES',
  is_staple   BOOLEAN NOT NULL DEFAULT FALSE,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_region_foods_region ON region_foods (region_id);

-- ─── Refresh Tokens (server-side tracking for revocation) ──

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti         VARCHAR(64) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens (jti) WHERE revoked_at IS NULL;
`;

async function migrate() {
  console.log('Running migrations…');
  await db.query(UP);
  console.log('Migrations complete.');
  await db.close();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
