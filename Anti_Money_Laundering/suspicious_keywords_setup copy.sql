-- Suspicious Keywords Setup Script
-- This script populates the suspicious_keywords table with comprehensive AML keywords

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS suspicious_keywords (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL UNIQUE,
    risk_level VARCHAR(20) NOT NULL,
    risk_score INT NOT NULL,
    category VARCHAR(100),
    description VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    case_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    whole_word_only BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6)
);

-- Clear existing data (optional)
-- DELETE FROM suspicious_keywords;

-- Insert CRITICAL risk keywords (76-100 points)
INSERT INTO suspicious_keywords (keyword, risk_level, risk_score, category, description, created_by, created_at) VALUES
('money laundering', 'CRITICAL', 100, 'FINANCIAL_CRIME', 'Direct reference to money laundering activity', 'SYSTEM', NOW()),
('terrorist', 'CRITICAL', 100, 'TERRORISM', 'Terrorism-related activity', 'SYSTEM', NOW()),
('terrorism', 'CRITICAL', 100, 'TERRORISM', 'Terrorism-related activity', 'SYSTEM', NOW()),
('drug trafficking', 'CRITICAL', 95, 'DRUG_RELATED', 'Drug trafficking activity', 'SYSTEM', NOW()),
('narcotics', 'CRITICAL', 95, 'DRUG_RELATED', 'Illegal drug trade', 'SYSTEM', NOW()),
('weapons', 'CRITICAL', 95, 'WEAPONS', 'Weapons trafficking', 'SYSTEM', NOW()),
('arms dealing', 'CRITICAL', 95, 'WEAPONS', 'Arms trafficking', 'SYSTEM', NOW()),
('fraud', 'CRITICAL', 90, 'FINANCIAL_CRIME', 'Fraudulent activity', 'SYSTEM', NOW()),
('scam', 'CRITICAL', 90, 'FINANCIAL_CRIME', 'Scam activity', 'SYSTEM', NOW()),
('blackmail', 'CRITICAL', 90, 'EXTORTION', 'Blackmail activity', 'SYSTEM', NOW()),
('ransom', 'CRITICAL', 90, 'EXTORTION', 'Ransom payment', 'SYSTEM', NOW()),
('bribe', 'CRITICAL', 85, 'CORRUPTION', 'Bribery activity', 'SYSTEM', NOW()),
('corruption', 'CRITICAL', 85, 'CORRUPTION', 'Corrupt practices', 'SYSTEM', NOW()),
('human trafficking', 'CRITICAL', 100, 'HUMAN_TRAFFICKING', 'Human trafficking activity', 'SYSTEM', NOW()),
('child exploitation', 'CRITICAL', 100, 'EXPLOITATION', 'Child exploitation', 'SYSTEM', NOW());

-- Insert HIGH risk keywords (51-75 points)
INSERT INTO suspicious_keywords (keyword, risk_level, risk_score, category, description, created_by, created_at) VALUES
('shell company', 'HIGH', 75, 'SHELL_ENTITIES', 'Shell company structure', 'SYSTEM', NOW()),
('offshore', 'HIGH', 70, 'OFFSHORE', 'Offshore financial activity', 'SYSTEM', NOW()),
('bitcoin', 'HIGH', 65, 'CRYPTOCURRENCY', 'Bitcoin transactions', 'SYSTEM', NOW()),
('cryptocurrency', 'HIGH', 65, 'CRYPTOCURRENCY', 'Cryptocurrency transactions', 'SYSTEM', NOW()),
('crypto', 'HIGH', 60, 'CRYPTOCURRENCY', 'Crypto transactions', 'SYSTEM', NOW()),
('anonymous', 'HIGH', 65, 'ANONYMITY', 'Anonymous transactions', 'SYSTEM', NOW()),
('untraceable', 'HIGH', 70, 'ANONYMITY', 'Untraceable payments', 'SYSTEM', NOW()),
('cash pickup', 'HIGH', 60, 'CASH_SERVICES', 'Cash pickup services', 'SYSTEM', NOW()),
('hawala', 'HIGH', 75, 'ALTERNATIVE_REMITTANCE', 'Hawala money transfer', 'SYSTEM', NOW()),
('smurfing', 'HIGH', 70, 'STRUCTURING', 'Smurfing technique', 'SYSTEM', NOW()),
('structuring', 'HIGH', 70, 'STRUCTURING', 'Transaction structuring', 'SYSTEM', NOW()),
('layering', 'HIGH', 65, 'MONEY_LAUNDERING', 'Layering technique', 'SYSTEM', NOW()),
('placement', 'HIGH', 65, 'MONEY_LAUNDERING', 'Placement technique', 'SYSTEM', NOW()),
('integration', 'HIGH', 60, 'MONEY_LAUNDERING', 'Integration technique', 'SYSTEM', NOW()),
('bearer bonds', 'HIGH', 70, 'BEARER_INSTRUMENTS', 'Bearer bond instruments', 'SYSTEM', NOW());

-- Insert MEDIUM risk keywords (26-50 points)
INSERT INTO suspicious_keywords (keyword, risk_level, risk_score, category, description, created_by, created_at) VALUES
('urgent', 'MEDIUM', 45, 'URGENCY', 'Urgent transaction request', 'SYSTEM', NOW()),
('immediate', 'MEDIUM', 45, 'URGENCY', 'Immediate transaction request', 'SYSTEM', NOW()),
('confidential', 'MEDIUM', 40, 'SECRECY', 'Confidential transaction', 'SYSTEM', NOW()),
('private', 'MEDIUM', 35, 'SECRECY', 'Private transaction', 'SYSTEM', NOW()),
('secret', 'MEDIUM', 45, 'SECRECY', 'Secret transaction', 'SYSTEM', NOW()),
('discreet', 'MEDIUM', 40, 'SECRECY', 'Discreet transaction', 'SYSTEM', NOW()),
('under the table', 'MEDIUM', 50, 'INFORMAL', 'Under the table payment', 'SYSTEM', NOW()),
('no questions', 'MEDIUM', 50, 'INFORMAL', 'No questions asked', 'SYSTEM', NOW()),
('cash only', 'MEDIUM', 45, 'CASH_PREFERENCE', 'Cash only transactions', 'SYSTEM', NOW()),
('bearer', 'MEDIUM', 40, 'BEARER_INSTRUMENTS', 'Bearer instruments', 'SYSTEM', NOW()),
('bulk cash', 'MEDIUM', 40, 'BULK_CASH', 'Bulk cash transactions', 'SYSTEM', NOW()),
('round amount', 'MEDIUM', 30, 'PATTERNS', 'Round amount transactions', 'SYSTEM', NOW()),
('exact amount', 'MEDIUM', 25, 'PATTERNS', 'Exact amount patterns', 'SYSTEM', NOW()),
('multiple transactions', 'MEDIUM', 35, 'PATTERNS', 'Multiple transaction pattern', 'SYSTEM', NOW()),
('split payment', 'MEDIUM', 40, 'STRUCTURING', 'Split payment structure', 'SYSTEM', NOW());

-- Insert LOW risk keywords (1-25 points)
INSERT INTO suspicious_keywords (keyword, risk_level, risk_score, category, description, created_by, created_at) VALUES
('large', 'LOW', 20, 'SIZE_INDICATORS', 'Large transaction indicator', 'SYSTEM', NOW()),
('business', 'LOW', 15, 'BUSINESS', 'Business transaction', 'SYSTEM', NOW()),
('investment', 'LOW', 20, 'INVESTMENT', 'Investment transaction', 'SYSTEM', NOW()),
('payment', 'LOW', 10, 'GENERAL', 'General payment', 'SYSTEM', NOW()),
('transfer', 'LOW', 10, 'GENERAL', 'General transfer', 'SYSTEM', NOW()),
('loan', 'LOW', 15, 'LENDING', 'Loan transaction', 'SYSTEM', NOW()),
('gift', 'LOW', 10, 'PERSONAL', 'Gift transaction', 'SYSTEM', NOW()),
('family', 'LOW', 5, 'PERSONAL', 'Family transaction', 'SYSTEM', NOW()),
('salary', 'LOW', 5, 'EMPLOYMENT', 'Salary payment', 'SYSTEM', NOW()),
('bonus', 'LOW', 10, 'EMPLOYMENT', 'Bonus payment', 'SYSTEM', NOW());

-- Create indexes for better performance
CREATE INDEX idx_suspicious_keywords_active ON suspicious_keywords(is_active);
CREATE INDEX idx_suspicious_keywords_risk_level ON suspicious_keywords(risk_level);
CREATE INDEX idx_suspicious_keywords_category ON suspicious_keywords(category);
CREATE INDEX idx_suspicious_keywords_risk_score ON suspicious_keywords(risk_score);

-- Verify the data
SELECT 
    risk_level,
    COUNT(*) as keyword_count,
    MIN(risk_score) as min_score,
    MAX(risk_score) as max_score,
    AVG(risk_score) as avg_score
FROM suspicious_keywords 
WHERE is_active = true 
GROUP BY risk_level 
ORDER BY avg_score DESC;

-- Show sample keywords by category
SELECT category, COUNT(*) as count 
FROM suspicious_keywords 
WHERE is_active = true 
GROUP BY category 
ORDER BY count DESC;
