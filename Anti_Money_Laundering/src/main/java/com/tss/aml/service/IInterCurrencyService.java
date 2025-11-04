package com.tss.aml.service;

import java.math.BigDecimal;
import java.util.List;

import com.tss.aml.entity.BankAccount;
import com.tss.aml.entity.CurrencyExchange;
import com.tss.aml.service.impl.CurrencyExchangeService.CurrencyConversionResult;

public interface IInterCurrencyService {
	
	boolean isIntercurrencyTransferRequired(BankAccount fromAccount, BankAccount toAccount);
    CurrencyExchange getActiveExchangeRate(String fromCurrency, String toCurrency);
    CurrencyConversionResult calculateConversion(String fromCurrency, String toCurrency, BigDecimal amount);
    void validateSufficientFunds(BankAccount fromAccount, BigDecimal totalDebitAmount);
    boolean isCurrencyPairSupported(String fromCurrency, String toCurrency);
    List<String> getSupportedCurrencyPairs();
}
