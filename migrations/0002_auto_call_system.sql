-- auto-call system tables

-- scheduled calls - tracks all automated calls to therapist practices
CREATE TABLE IF NOT EXISTS scheduled_calls (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  therapist_id TEXT NOT NULL,
  therapist_name TEXT,
  therapist_phone TEXT NOT NULL,
  e_id TEXT,
  elevenlabs_conv_id TEXT,
  scheduled_at INTEGER NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,
  status TEXT NOT NULL,
  outcome TEXT,
  transcript TEXT,
  analysis TEXT,
  appointment_date TEXT,
  appointment_time TEXT,
  callback_info TEXT,
  rejection_reason TEXT,
  notes TEXT,
  duration_seconds INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER
);

-- therapist blocklist - practices that rejected ai calls
CREATE TABLE IF NOT EXISTS therapist_blocklist (
  id TEXT PRIMARY KEY,
  e_id TEXT NOT NULL UNIQUE,
  therapist_name TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  permanent INTEGER DEFAULT 0,
  reported_by_user TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER
);

-- therapist cache - stores parsed details including opening hours
CREATE TABLE IF NOT EXISTS therapist_cache (
  e_id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  address TEXT,
  opening_hours TEXT,
  specialties TEXT,
  languages TEXT,
  accessibility TEXT,
  raw_html TEXT,
  fetched_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

-- user call credits - tracks monthly allocation and usage
CREATE TABLE IF NOT EXISTS user_call_credits (
  user_id TEXT PRIMARY KEY REFERENCES user(id),
  credits_total INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  credits_refunded INTEGER DEFAULT 0,
  last_refill_at INTEGER
);

-- call cost events - tracks all costs
CREATE TABLE IF NOT EXISTS call_cost_events (
  id TEXT PRIMARY KEY,
  call_id TEXT REFERENCES scheduled_calls(id),
  user_id TEXT NOT NULL REFERENCES user(id),
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  duration_seconds INTEGER,
  cost_usd TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

-- privacy incidents - tracks potential issues for admin review
CREATE TABLE IF NOT EXISTS privacy_incidents (
  id TEXT PRIMARY KEY,
  call_id TEXT REFERENCES scheduled_calls(id),
  therapist_e_id TEXT,
  severity TEXT NOT NULL,
  transcript_excerpt TEXT,
  action_taken TEXT,
  admin_reviewed INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_user_id ON scheduled_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_status ON scheduled_calls(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_scheduled_at ON scheduled_calls(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_elevenlabs_conv_id ON scheduled_calls(elevenlabs_conv_id);
CREATE INDEX IF NOT EXISTS idx_therapist_blocklist_e_id ON therapist_blocklist(e_id);
CREATE INDEX IF NOT EXISTS idx_therapist_cache_expires_at ON therapist_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_call_cost_events_user_id ON call_cost_events(user_id);
CREATE INDEX IF NOT EXISTS idx_call_cost_events_call_id ON call_cost_events(call_id);
CREATE INDEX IF NOT EXISTS idx_privacy_incidents_call_id ON privacy_incidents(call_id);
