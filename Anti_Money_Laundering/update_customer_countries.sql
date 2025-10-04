-- Update Customer Countries for Testing
-- This script adds country information to customer addresses

-- Update customers with different countries for testing
UPDATE customers SET 
    street = '123 Main Street',
    city = 'New York', 
    state = 'NY',
    country = 'US',
    postal_code = '10001'
WHERE id = 1;

UPDATE customers SET 
    street = '456 High Street',
    city = 'Luanda', 
    state = 'Luanda',
    country = 'AO',  -- Angola (High Risk - 80)
    postal_code = '12345'
WHERE id = 2;

UPDATE customers SET 
    street = '789 King Street',
    city = 'Kabul', 
    state = 'Kabul',
    country = 'AF',  -- Afghanistan (High Risk - 95)
    postal_code = '67890'
WHERE id = 3;

UPDATE customers SET 
    street = '321 Queen Street',
    city = 'Sydney', 
    state = 'NSW',
    country = 'AU',  -- Australia (Low Risk - 20)
    postal_code = '2000'
WHERE id = 4;

UPDATE customers SET 
    street = '654 Parliament Street',
    city = 'Vienna', 
    state = 'Vienna',
    country = 'AT',  -- Austria (Low Risk - 15)
    postal_code = '1010'
WHERE id = 5;

-- You can also use country names instead of codes
UPDATE customers SET 
    street = '987 Broadway',
    city = 'Buenos Aires', 
    state = 'Buenos Aires',
    country = 'Argentina',  -- Will be converted to AR (Medium Risk - 60)
    postal_code = 'C1000'
WHERE id = 6;

-- Verify the updates
SELECT 
    id, 
    first_name, 
    last_name, 
    email,
    country,
    city
FROM customers 
WHERE country IS NOT NULL
ORDER BY id;
