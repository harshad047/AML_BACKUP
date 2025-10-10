-- Add intercurrency exchange columns to transaction table
-- Execute this script to add support for intercurrency transfers

ALTER TABLE transaction 
ADD COLUMN transaction_reference VARCHAR(50) NULL,
ADD COLUMN original_amount DECIMAL(15,2) NULL,
ADD COLUMN original_currency VARCHAR(3) NULL,
ADD COLUMN converted_amount DECIMAL(15,2) NULL,
ADD COLUMN converted_currency VARCHAR(3) NULL,
ADD COLUMN exchange_rate DECIMAL(10,6) NULL,
ADD COLUMN conversion_charges DECIMAL(15,2) NULL,
ADD COLUMN total_debit_amount DECIMAL(15,2) NULL;

-- Add index for better query performance
CREATE INDEX idx_transaction_reference ON transaction(transaction_reference);
CREATE INDEX idx_transaction_type ON transaction(transaction_type);
CREATE INDEX idx_original_currency ON transaction(original_currency);
CREATE INDEX idx_converted_currency ON transaction(converted_currency);

-- Update existing transactions to have transaction references
UPDATE transaction 
SET transaction_reference = CONCAT(
    CASE 
        WHEN transaction_type = 'DEPOSIT' THEN 'DEP-'
        WHEN transaction_type = 'WITHDRAWAL' THEN 'WTH-'
        WHEN transaction_type = 'TRANSFER' THEN 'TRF-'
        ELSE 'TXN-'
    END,
    UPPER(SUBSTRING(MD5(CONCAT(id, created_at)), 1, 8))
)
WHERE transaction_reference IS NULL;
