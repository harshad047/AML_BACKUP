-- Simple fix for customer_id foreign key constraint
-- Run this if you're getting foreign key constraint errors

-- Option 1: Drop and recreate transaction table (DEVELOPMENT ONLY)
DROP TABLE IF EXISTS transaction;

-- Option 2: Fix existing table (PRODUCTION)
-- SET FOREIGN_KEY_CHECKS = 0;
-- ALTER TABLE transaction DROP FOREIGN KEY IF EXISTS FKu2anf16eh7wulf2gnh2g713u;
-- ALTER TABLE transaction MODIFY COLUMN customer_id BIGINT NULL;
-- DELETE FROM transaction WHERE customer_id IS NOT NULL AND customer_id NOT IN (SELECT id FROM customers);
-- SET FOREIGN_KEY_CHECKS = 1;

-- The application will recreate the transaction table with proper constraints
-- when you restart it after the code changes
