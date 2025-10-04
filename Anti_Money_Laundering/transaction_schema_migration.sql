-- Clean Transaction Schema Migration Script
-- This script creates a clean transaction table structure

-- Step 1: Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Step 2: Drop existing foreign key constraints
ALTER TABLE transaction DROP FOREIGN KEY IF EXISTS FK_transaction_from_account;
ALTER TABLE transaction DROP FOREIGN KEY IF EXISTS FK_transaction_to_account;
ALTER TABLE transaction DROP FOREIGN KEY IF EXISTS FK_transaction_customer;
ALTER TABLE transaction DROP FOREIGN KEY IF EXISTS FKu2anf16eh7wulf2gnh2g713u;

-- Step 3: Add new columns
ALTER TABLE transaction 
ADD COLUMN from_account_number VARCHAR(255) NULL,
ADD COLUMN to_account_number VARCHAR(255) NULL;

-- Step 4: Migrate existing data (if any)
-- Update from_account_number based on from_account_id
UPDATE transaction t 
INNER JOIN bank_account ba ON t.from_account_id = ba.id 
SET t.from_account_number = ba.account_number 
WHERE t.from_account_id IS NOT NULL;

-- Update to_account_number based on to_account_id
UPDATE transaction t 
INNER JOIN bank_account ba ON t.to_account_id = ba.id 
SET t.to_account_number = ba.account_number 
WHERE t.to_account_id IS NOT NULL;

-- Step 5: Drop old columns
ALTER TABLE transaction 
DROP COLUMN from_account_id,
DROP COLUMN to_account_id;

-- Step 6: Modify customer_id to be BIGINT (not a foreign key)
ALTER TABLE transaction MODIFY COLUMN customer_id BIGINT NULL;

-- Step 7: Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Step 4: Add indexes for performance
CREATE INDEX idx_transaction_from_account_number ON transaction(from_account_number);
CREATE INDEX idx_transaction_to_account_number ON transaction(to_account_number);
CREATE INDEX idx_transaction_customer_id ON transaction(customer_id);
CREATE INDEX idx_transaction_created_at ON transaction(created_at);
CREATE INDEX idx_transaction_status ON transaction(status);
CREATE INDEX idx_transaction_type ON transaction(transaction_type);

-- Step 5: Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Step 6: Verify the clean structure
DESCRIBE transaction;

-- Expected columns:
-- id, transaction_type, from_account_number, to_account_number, customer_id,
-- amount, currency, description, status, nlp_score, rule_engine_score,
-- combined_risk_score, threshold_exceeded, alert_id, created_at, updated_at
