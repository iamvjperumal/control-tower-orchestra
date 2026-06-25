-- Confluent Cloud Flink: Database Setup
-- Execute these statements FIRST before any table creation

-- Step 1: Switch to Hive dialect to support CREATE DATABASE
SET 'table.sql-dialect' = 'hive';

-- Step 2: Create a database for SignalTwin AI
CREATE DATABASE IF NOT EXISTS signaltwin;

-- Step 3: Switch back to default Flink SQL dialect for streaming queries
SET 'table.sql-dialect' = 'default';

-- Step 4: Use the database
USE signaltwin;

-- Step 5: Verify you're in the right database
SHOW CURRENT DATABASE;

-- Now you can proceed with creating tables
-- All subsequent CREATE TABLE statements will be created in this database

-- Made with Bob
