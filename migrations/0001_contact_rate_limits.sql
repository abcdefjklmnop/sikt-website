-- No names, email addresses, messages or raw IP addresses are stored here.
CREATE TABLE IF NOT EXISTS contact_rate_limits (
  key TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts BETWEEN 1 AND 5),
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS contact_rate_limits_expiry
  ON contact_rate_limits (expires_at);
