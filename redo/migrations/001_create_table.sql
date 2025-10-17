-- Migration: create table3f
CREATE TABLE IF NOT EXISTS table3f (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jj_no INTEGER,
  description TEXT,
  type TEXT,
  -- Use TEXT for these columns because CSV contains percentage strings (e.g. "0.7%")
  day_school_candidates_no TEXT,
  day_school_candidates_cumulative_total TEXT,
  all_candidates_no TEXT,
  all_candidates_cumulative_total TEXT
);
