// Transaction Service Models

export interface TransactionDto {
  id: number;
  transactionType: string;
  toAccountNumber?: string;
  fromAccountNumber?: string;
  customerId: number;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  nlpScore?: number;
  ruleEngineScore?: number;
  combinedRiskScore?: number;
  thresholdExceeded?: boolean;
  alertId?: string;
  createdAt: string;
  updatedAt: string;
  transactionReference: string;
  // Intercurrency extras (optional)
  originalAmount?: number;
  originalCurrency?: string;
  convertedAmount?: number;
  convertedCurrency?: string;
}

export interface DepositDto {
  toAccountNumber: string;
  amount: number;
  currency?: string;  // Optional - backend auto-detects from toAccount
  description?: string;
}

export interface WithdrawalDto {
  fromAccountNumber: string;
  amount: number;
  description?: string;
}

export interface TransferDto {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  currency?: string;  // Optional - backend auto-detects from fromAccount
  description?: string;
  receiverCountryCode?: string;
}

export interface IntercurrencyTransferDto {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  description?: string;
  receiverCountryCode?: string;
}

export interface CurrencyConversionDto {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount?: number;
  exchangeRate?: number;
}

export interface BalanceDto {
  accountNumber: string;
  balance: number;
  currency: string;
}
