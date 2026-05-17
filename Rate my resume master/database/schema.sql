-- Run this SQL in your PostgreSQL database to set up the schema.
-- Works with Neon, Supabase, Railway, or any PostgreSQL provider.

CREATE TABLE IF NOT EXISTS resumes (
  id          SERIAL PRIMARY KEY,
  file_name   TEXT    NOT NULL,
  job_title   TEXT,
  industry    TEXT,
  overall_score INTEGER NOT NULL,
  grade       TEXT    NOT NULL,
  summary     TEXT    NOT NULL,
  strengths   JSONB   NOT NULL DEFAULT '[]',
  score_breakdown JSONB NOT NULL DEFAULT '[]',
  suggestions JSONB   NOT NULL DEFAULT '[]',
  ai_insights TEXT    NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
