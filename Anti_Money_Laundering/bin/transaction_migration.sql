-- Transaction Table Migration Script
-- Run this BEFORE starting the application if you have existing transaction data

-- Step 1: Check if customer_id column exists and is causing issues
-- If you have existing transactions without customer_id, this will fix them

-- Option 1: If you want to keep existing transactions, update them with a default customer
-- UPDATE transaction 
-- SET customer_id = (
--     SELECT c.id 
--     FROM customer c 
--     INNER JOIN users u ON c.email = u.email 
--     INNER JOIN bank_account ba ON ba.user_id = u.id 
--     WHERE ba.id = transaction.from_account_id OR ba.id = transaction.to_account_id 
--     LIMIT 1
-- ) 
-- WHERE customer_id IS NULL;

-- Option 2: If you want to start fresh with transactions (RECOMMENDED for development)
-- This will delete all existing transactions
DELETE FROM transaction;

-- Step 3: Reset auto-increment if needed
ALTER TABLE transaction AUTO_INCREMENT = 1;

-- Step 4: Ensure proper column constraints
ALTER TABLE transaction MODIFY COLUMN customer_id BIGINT NULL;
ALTER TABLE transaction MODIFY COLUMN created_at DATETIME(6) NULL;
ALTER TABLE transaction MODIFY COLUMN updated_at DATETIME(6) NULL;
