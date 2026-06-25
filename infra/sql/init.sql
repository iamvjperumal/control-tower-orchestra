CREATE TABLE IF NOT EXISTS customers (
  customer_id VARCHAR(50) PRIMARY KEY,
  email_hash VARCHAR(64),
  tier VARCHAR(20) DEFAULT 'standard',
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  account_age_days INT DEFAULT 0,
  region VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO customers (customer_id, email_hash, tier, lifetime_value, account_age_days, region) VALUES
('c-1001', 'a1b2c3d4e5f6', 'vip', 15000.00, 730, 'US-WEST'),
('c-1002', 'd4e5f6a1b2c3', 'premium', 8500.00, 365, 'US-EAST'),
('c-1003', 'g7h8i9j0k1l2', 'standard', 450.00, 30, 'EU-WEST'),
('c-1004', 'm3n4o5p6q7r8', 'vip', 22000.00, 1095, 'US-WEST'),
('c-1005', 's9t0u1v2w3x4', 'premium', 5200.00, 180, 'APAC'),
('c-1006', 'y5z6a7b8c9d0', 'standard', 120.00, 14, 'US-EAST'),
('c-1007', 'e1f2g3h4i5j6', 'premium', 9800.00, 540, 'EU-WEST'),
('c-1008', 'k7l8m9n0o1p2', 'standard', 780.00, 90, 'US-WEST'),
('c-1009', 'q3r4s5t6u7v8', 'vip', 31000.00, 1460, 'APAC'),
('c-1010', 'w9x0y1z2a3b4', 'standard', 250.00, 45, 'EU-WEST');
