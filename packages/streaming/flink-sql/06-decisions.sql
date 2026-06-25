-- Decision routing view for monitoring
-- Actual AI recommendation generation happens in the worker service
-- since it requires calling the Claude API, which Flink SQL cannot do.

CREATE VIEW risk_summary AS
SELECT
  customer_id,
  risk_score,
  event_time,
  CASE
    WHEN risk_score > 60 THEN 'ESCALATE'
    WHEN risk_score > 30 THEN 'MONITOR'
    ELSE 'NO_ACTION'
  END AS suggested_action
FROM signals_risk;
