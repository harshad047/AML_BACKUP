-- Database Migration Script for BankAccount Timestamps
-- Run this BEFORE starting the application

-- Step 1: Add columns as nullable first
ALTER TABLE bank_account 
ADD COLUMN created_at DATETIME(6) NULL,
ADD COLUMN updated_at DATETIME(6) NULL,
ADD COLUMN approved_at DATETIME(6) NULL,
ADD COLUMN rejected_at DATETIME(6) NULL,
ADD COLUMN suspended_at DATETIME(6) NULL,
ADD COLUMN activated_at DATETIME(6) NULL;

-- Step 2: Update existing records with current timestamp
UPDATE bank_account 
SET created_at = NOW(), 
    updated_at = NOW() 
WHERE created_at IS NULL;

-- Step 3: Set approved_at for already approved accounts
UPDATE bank_account 
SET approved_at = NOW() 
WHERE approval_status = 'APPROVED' AND approved_at IS NULL;

-- Step 4: Set rejected_at for rejected accounts
UPDATE bank_account 
SET rejected_at = NOW() 
WHERE approval_status = 'REJECTED' AND rejected_at IS NULL;

-- Step 5: Set suspended_at for suspended accounts
UPDATE bank_account 
SET suspended_at = NOW() 
WHERE status = 'SUSPENDED' AND suspended_at IS NULL;

-- Optional: Make created_at NOT NULL after data migration (uncomment if needed)
-- ALTER TABLE bank_account MODIFY COLUMN created_at DATETIME(6) NOT NULL;
