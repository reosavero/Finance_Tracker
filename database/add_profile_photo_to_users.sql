USE finance_trackers;

ALTER TABLE users
  ADD COLUMN profile_photo VARCHAR(255) NULL COMMENT 'Path foto profil user' AFTER monthly_allowance;
