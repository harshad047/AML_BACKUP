-- Test Rules Setup for AML System
-- Run this to create basic rules for testing

-- Insert basic high-amount rule
INSERT INTO rules (name, description, risk_weight, priority, is_active, created_at) 
VALUES ('High Amount Transfer', 'Flag transfers over $20,000', 70, 1, true, NOW());

-- Get the rule ID for conditions
SET @rule_id = LAST_INSERT_ID();

-- Add condition for high amount
INSERT INTO rule_conditions (rule_id, type, field, operator, value, is_active, created_at)
VALUES (@rule_id, 'AMOUNT', 'amount', '>', '20000', true, NOW());

-- Insert medium amount rule
INSERT INTO rules (name, description, risk_weight, priority, is_active, created_at) 
VALUES ('Medium Amount Transfer', 'Flag transfers over $10,000', 50, 2, true, NOW());

SET @rule_id2 = LAST_INSERT_ID();

-- Add condition for medium amount
INSERT INTO rule_conditions (rule_id, type, field, operator, value, is_active, created_at)
VALUES (@rule_id2, 'AMOUNT', 'amount', '>', '10000', true, NOW());

-- Insert past transactions rule
INSERT INTO rules (name, description, risk_weight, priority, is_active, created_at) 
VALUES ('Frequent Large Transactions', 'Flag customers with many large transactions', 60, 3, true, NOW());

SET @rule_id3 = LAST_INSERT_ID();

-- Add condition for transaction count
INSERT INTO rule_conditions (rule_id, type, field, operator, value, is_active, created_at)
VALUES (@rule_id3, 'PAST_TRANSACTIONS', 'count', '>', '5', true, NOW());

-- Add condition for transaction sum
INSERT INTO rule_conditions (rule_id, type, field, operator, value, is_active, created_at)
VALUES (@rule_id3, 'PAST_TRANSACTIONS', 'sum', '>', '50000', true, NOW());

-- Verify rules were created
SELECT 
    r.id, r.name, r.risk_weight, r.is_active,
    rc.type, rc.field, rc.operator, rc.value
FROM rules r
LEFT JOIN rule_conditions rc ON r.id = rc.rule_id
WHERE r.is_active = true
ORDER BY r.priority;
