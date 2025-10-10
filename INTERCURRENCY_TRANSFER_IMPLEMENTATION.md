# Intercurrency Transfer Implementation Guide

## Overview

This implementation adds comprehensive intercurrency transfer functionality to your AML system. The system automatically detects when transfers involve different currencies and applies appropriate conversion rates and charges.

## Key Features

### ✅ **Automatic Currency Detection**
- Regular `/api/transactions/transfer` endpoint automatically detects different currencies
- Seamlessly handles both same-currency and intercurrency transfers
- No changes needed to existing transfer calls

### ✅ **Real Bank-like Charges**
- Percentage-based charges (e.g., 2.5%)
- Fixed charges (e.g., $5)
- Minimum and maximum charge limits
- Transparent charge breakdown

### ✅ **Comprehensive Data Storage**
- All intercurrency data stored in single `transaction` table
- Original amount and currency preserved
- Converted amount and currency tracked
- Exchange rate and charges recorded
- Transaction reference for audit trail

### ✅ **AML Compliance Integration**
- All intercurrency transfers go through existing risk assessment
- Enhanced descriptions with conversion details
- Same blocking/flagging logic applies
- Audit trail maintained

## Database Changes

### New Transaction Table Columns
```sql
-- Execute this migration script
ALTER TABLE transaction 
ADD COLUMN transaction_reference VARCHAR(50) NULL,
ADD COLUMN original_amount DECIMAL(15,2) NULL,
ADD COLUMN original_currency VARCHAR(3) NULL,
ADD COLUMN converted_amount DECIMAL(15,2) NULL,
ADD COLUMN converted_currency VARCHAR(3) NULL,
ADD COLUMN exchange_rate DECIMAL(10,6) NULL,
ADD COLUMN conversion_charges DECIMAL(15,2) NULL,
ADD COLUMN total_debit_amount DECIMAL(15,2) NULL;
```

### Currency Exchange Table
Your existing `currency_exchange` table is used with these columns:
- `from_currency`, `to_currency` - Currency pair
- `exchange_rate` - Conversion rate
- `base_charge_percentage` - Percentage charge (e.g., 0.025 = 2.5%)
- `fixed_charge` - Fixed charge amount
- `minimum_charge`, `maximum_charge` - Charge limits
- `is_active`, `effective_from`, `effective_until` - Rate validity

## API Endpoints

### 1. **Regular Transfer (Auto-Detection)**
```http
POST /api/transactions/transfer
Content-Type: application/json

{
    "fromAccountNumber": "AC-123456",
    "toAccountNumber": "AC-789012", 
    "amount": 1000.00,
    "currency": "USD",
    "description": "Payment to supplier",
    "receiverCountryCode": "IN"
}
```

**Behavior:**
- If accounts have same currency → Regular transfer
- If accounts have different currencies → Automatic intercurrency conversion

### 2. **Explicit Intercurrency Transfer**
```http
POST /api/transactions/intercurrency-transfer
Content-Type: application/json

{
    "fromAccountNumber": "AC-123456",
    "toAccountNumber": "AC-789012",
    "amount": 1000.00,
    "description": "USD to INR conversion",
    "receiverCountryCode": "IN"
}
```

### 3. **Currency Conversion Calculator**
```http
POST /api/transactions/currency-conversion/calculate
Content-Type: application/json

{
    "fromCurrency": "USD",
    "toCurrency": "INR", 
    "amount": 1000.00
}
```

**Response:**
```json
{
    "originalAmount": 1000.00,
    "originalCurrency": "USD",
    "convertedAmount": 83500.00,
    "convertedCurrency": "INR",
    "exchangeRate": 83.5000,
    "conversionCharges": 28.00,
    "totalDebitAmount": 1028.00,
    "chargeBreakdown": "Base charge: 2.0000% of 1000.00 = 20.00 + Fixed charge: 8.00 = 28.00",
    "supported": true
}
```

### 4. **Currency Support Check**
```http
GET /api/currency/supported-pairs
GET /api/currency/supported/{fromCurrency}/{toCurrency}
```

## Transaction Flow

### Same Currency Transfer
```
USD Account → USD Account
1. Validate accounts and balances
2. Risk assessment
3. Direct transfer (no conversion)
```

### Intercurrency Transfer
```
USD Account → INR Account
1. Detect different currencies
2. Calculate conversion: 1000 USD → 83,500 INR
3. Calculate charges: 28 USD
4. Validate sufficient funds: 1,028 USD required
5. Risk assessment with conversion details
6. Execute: Debit 1,028 USD, Credit 83,500 INR
```

## Example Scenarios

### Scenario 1: USD to INR Transfer
```
Original Amount: $1,000 USD
Exchange Rate: 83.5000
Conversion Charges: $28 USD (2.8%)
Converted Amount: ₹83,500 INR
Total Debit: $1,028 USD
```

### Scenario 2: EUR to GBP Transfer
```
Original Amount: €500 EUR  
Exchange Rate: 0.8800
Conversion Charges: €15 EUR (3.0%)
Converted Amount: £440 GBP
Total Debit: €515 EUR
```

## Transaction Data Storage

### Regular Transfer Record
```json
{
    "id": 123,
    "transactionType": "TRANSFER",
    "fromAccountNumber": "AC-123456",
    "toAccountNumber": "AC-789012",
    "amount": 1000.00,
    "currency": "USD",
    "status": "APPROVED",
    "transactionReference": "TRF-A1B2C3D4"
}
```

### Intercurrency Transfer Record
```json
{
    "id": 124,
    "transactionType": "INTERCURRENCY_TRANSFER", 
    "fromAccountNumber": "AC-123456",
    "toAccountNumber": "AC-789012",
    "amount": 1000.00,
    "currency": "USD",
    "originalAmount": 1000.00,
    "originalCurrency": "USD",
    "convertedAmount": 83500.00,
    "convertedCurrency": "INR", 
    "exchangeRate": 83.5000,
    "conversionCharges": 28.00,
    "totalDebitAmount": 1028.00,
    "status": "APPROVED",
    "transactionReference": "ICT-X9Y8Z7W6",
    "description": "Payment | Conversion: 1000.00 USD → 83500.00 INR (Rate: 83.5000, Charges: 28.00 USD)"
}
```

## Testing Guide

### 1. **Setup Test Data**
Ensure your `currency_exchange` table has rates for testing:
- USD → INR (Rate: ~83.5)
- EUR → USD (Rate: ~1.18)
- GBP → USD (Rate: ~1.33)

### 2. **Test Same Currency Transfer**
```bash
# Should work as before (no changes)
curl -X POST http://localhost:8080/api/transactions/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fromAccountNumber": "AC-USD001",
    "toAccountNumber": "AC-USD002", 
    "amount": 100.00,
    "currency": "USD",
    "description": "Same currency test"
  }'
```

### 3. **Test Automatic Intercurrency Detection**
```bash
# Should automatically detect and convert
curl -X POST http://localhost:8080/api/transactions/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fromAccountNumber": "AC-USD001",
    "toAccountNumber": "AC-INR001",
    "amount": 100.00,
    "currency": "USD", 
    "description": "Auto intercurrency test"
  }'
```

### 4. **Test Conversion Calculator**
```bash
curl -X POST http://localhost:8080/api/transactions/currency-conversion/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fromCurrency": "USD",
    "toCurrency": "INR",
    "amount": 1000.00
  }'
```

## Error Handling

### Common Error Scenarios
1. **Unsupported Currency Pair**
   ```json
   {
     "error": "Exchange rate not available for USD to XYZ"
   }
   ```

2. **Insufficient Funds (Including Charges)**
   ```json
   {
     "error": "Insufficient funds. Available: 1000.00 USD, Required: 1028.00 USD (including conversion charges)"
   }
   ```

3. **Same Currency Error**
   ```json
   {
     "error": "Both accounts have the same currency. Use regular transfer instead."
   }
   ```

## Integration Notes

### ✅ **Backward Compatibility**
- Existing transfer calls work unchanged
- No breaking changes to current functionality
- Same risk assessment and AML compliance

### ✅ **Account Currency Detection**
- Automatically fetches currency from `BankAccount.currency` field
- No manual currency specification needed
- Supports any currency pair in `currency_exchange` table

### ✅ **Risk Assessment Integration**
- Enhanced descriptions include conversion details
- Same blocking/flagging thresholds apply
- Conversion charges considered in risk calculation

## Production Deployment

### 1. **Database Migration**
```sql
-- Run the migration script
source add_intercurrency_columns.sql
```

### 2. **Verify Currency Exchange Data**
```sql
-- Check available currency pairs
SELECT from_currency, to_currency, exchange_rate, is_active 
FROM currency_exchange 
WHERE is_active = 1;
```

### 3. **Test Endpoints**
- Verify all endpoints respond correctly
- Test with real currency pairs from your database
- Validate charge calculations

### 4. **Monitor Logs**
Look for these log messages:
- `"INTERCURRENCY TRANSFER DETECTED: USD to INR"`
- `"INTERCURRENCY TRANSFER APPROVED: Money transferred successfully with conversion"`
- `"Debited: 1028.00 USD"`
- `"Credited: 83500.00 INR"`

## Summary

Your AML system now supports:
- ✅ Automatic intercurrency detection in regular transfers
- ✅ Real bank-like conversion charges
- ✅ Comprehensive transaction data storage
- ✅ Full AML compliance integration
- ✅ Transparent charge breakdown
- ✅ Backward compatibility with existing transfers

The implementation is production-ready and maintains all existing functionality while adding powerful intercurrency capabilities.
