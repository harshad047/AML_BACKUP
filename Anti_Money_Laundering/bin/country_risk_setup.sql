-- Country Risk Setup for Testing
-- Add some basic country risk data

INSERT INTO country_risk (country_code, country_name, risk_score, created_by, notes) VALUES
('US', 'United States', 20, 'SYSTEM', 'Low risk - Strong AML regulations'),
('CA', 'Canada', 15, 'SYSTEM', 'Very low risk - Robust financial oversight'),
('GB', 'United Kingdom', 25, 'SYSTEM', 'Low risk - Comprehensive AML framework'),
('DE', 'Germany', 18, 'SYSTEM', 'Low risk - Strong regulatory environment'),
('FR', 'France', 22, 'SYSTEM', 'Low risk - FATF member with strong controls'),
('JP', 'Japan', 12, 'SYSTEM', 'Very low risk - Advanced AML systems'),
('AU', 'Australia', 16, 'SYSTEM', 'Low risk - AUSTRAC oversight'),
('CH', 'Switzerland', 30, 'SYSTEM', 'Medium risk - Banking secrecy concerns'),
('LU', 'Luxembourg', 45, 'SYSTEM', 'Medium risk - Financial center'),
('MC', 'Monaco', 50, 'SYSTEM', 'Medium risk - Tax haven characteristics'),
('BM', 'Bermuda', 60, 'SYSTEM', 'High risk - Offshore financial center'),
('KY', 'Cayman Islands', 85, 'SYSTEM', 'High risk - Major offshore jurisdiction'),
('VG', 'British Virgin Islands', 90, 'SYSTEM', 'High risk - Shell company formation'),
('PA', 'Panama', 88, 'SYSTEM', 'High risk - Panama Papers concerns'),
('LI', 'Liechtenstein', 75, 'SYSTEM', 'High risk - Banking secrecy'),
('AD', 'Andorra', 70, 'SYSTEM', 'High risk - Limited transparency'),
('MT', 'Malta', 65, 'SYSTEM', 'High risk - Citizenship by investment'),
('CY', 'Cyprus', 68, 'SYSTEM', 'High risk - Russian money flows'),
('LV', 'Latvia', 72, 'SYSTEM', 'High risk - Money laundering scandals'),
('EE', 'Estonia', 55, 'SYSTEM', 'Medium risk - Cryptocurrency hub'),
('AF', 'Afghanistan', 95, 'SYSTEM', 'Critical risk - FATF blacklist'),
('AL', 'Albania', 70, 'SYSTEM', 'High risk - Organized crime'),
('AO', 'Angola', 80, 'SYSTEM', 'High risk - Corruption and weak controls'),
('AR', 'Argentina', 60, 'SYSTEM', 'High risk - Economic instability')
ON DUPLICATE KEY UPDATE 
    risk_score = VALUES(risk_score),
    country_name = VALUES(country_name),
    notes = VALUES(notes);

-- Verify the data
SELECT * FROM country_risk ORDER BY risk_score DESC;
