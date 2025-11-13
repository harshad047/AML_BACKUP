package com.tss.aml.service.impl;

import com.tss.aml.entity.BankAccount;
import com.tss.aml.entity.CurrencyExchange;
import com.tss.aml.exception.AmlApiException;
import com.tss.aml.repository.CurrencyExchangeRepository;
import com.tss.aml.service.IInterCurrencyService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CurrencyExchangeService implements IInterCurrencyService{

    private final CurrencyExchangeRepository currencyExchangeRepository;

   
    public boolean isIntercurrencyTransferRequired(BankAccount fromAccount, BankAccount toAccount) {
        if (fromAccount.getCurrency() == null || toAccount.getCurrency() == null) {
            return false;
        }
        return !fromAccount.getCurrency().equalsIgnoreCase(toAccount.getCurrency());
    }

    
    public CurrencyExchange getActiveExchangeRate(String fromCurrency, String toCurrency) {
        return currencyExchangeRepository.findActiveExchangeRate(
                fromCurrency.toUpperCase(), 
                toCurrency.toUpperCase(), 
                LocalDateTime.now()
        ).orElseThrow(() -> new AmlApiException(
                HttpStatus.BAD_REQUEST, 
                "Exchange rate not available for " + fromCurrency + " to " + toCurrency
        ));
    }

    public CurrencyConversionResult calculateConversion(
            String fromCurrency, 
            String toCurrency, 
            BigDecimal amount) {
        
        CurrencyExchange exchangeRate = getActiveExchangeRate(fromCurrency, toCurrency);
        
        BigDecimal conversionCharges = exchangeRate.calculateTotalCharge(amount);
        
        BigDecimal amountAfterCharges = amount.subtract(conversionCharges);
        
        BigDecimal convertedAmount = exchangeRate.convertAmount(amountAfterCharges);
        
        BigDecimal totalDebitAmount = amount;
        
        return CurrencyConversionResult.builder()
                .originalAmount(amount)
                .originalCurrency(fromCurrency.toUpperCase())
                .convertedAmount(convertedAmount.setScale(2, RoundingMode.HALF_UP))
                .convertedCurrency(toCurrency.toUpperCase())
                .exchangeRate(exchangeRate.getExchangeRate())
                .conversionCharges(conversionCharges.setScale(2, RoundingMode.HALF_UP))
                .totalDebitAmount(totalDebitAmount.setScale(2, RoundingMode.HALF_UP))
                .chargeBreakdown(buildChargeBreakdown(exchangeRate, amount, conversionCharges))
                .build();
    }

    
    public void validateSufficientFunds(BankAccount fromAccount, BigDecimal totalDebitAmount) {
        if (fromAccount.getBalance().compareTo(totalDebitAmount) < 0) {
            throw new AmlApiException(
                HttpStatus.BAD_REQUEST, 
                String.format("Insufficient funds. Available: %s %s, Required: %s %s (including conversion charges)", 
                    fromAccount.getBalance(), fromAccount.getCurrency(),
                    totalDebitAmount, fromAccount.getCurrency())
            );
        }
    }

    
    public boolean isCurrencyPairSupported(String fromCurrency, String toCurrency) {
        return currencyExchangeRepository.isCurrencyPairSupported(
                fromCurrency.toUpperCase(), 
                toCurrency.toUpperCase(), 
                LocalDateTime.now()
        );
    }

   
    public List<String> getSupportedCurrencyPairs() {
        return currencyExchangeRepository.findAllSupportedCurrencyPairs();
    }

    
    private String buildChargeBreakdown(CurrencyExchange exchangeRate, BigDecimal amount, BigDecimal totalCharge) {
        BigDecimal percentageCharge = amount.multiply(exchangeRate.getBaseChargePercentage());
        BigDecimal calculatedCharge = percentageCharge.add(exchangeRate.getFixedCharge());
        
        StringBuilder breakdown = new StringBuilder();
        breakdown.append(String.format("Base charge: %.4f%% of %s = %s", 
                exchangeRate.getBaseChargePercentage().multiply(BigDecimal.valueOf(100)), 
                amount, 
                percentageCharge.setScale(2, RoundingMode.HALF_UP)));
        
        breakdown.append(String.format(" + Fixed charge: %s", 
                exchangeRate.getFixedCharge()));
        
        breakdown.append(String.format(" = %s", 
                calculatedCharge.setScale(2, RoundingMode.HALF_UP)));
        
        if (totalCharge.compareTo(exchangeRate.getMinimumCharge()) == 0 && 
            calculatedCharge.compareTo(exchangeRate.getMinimumCharge()) < 0) {
            breakdown.append(String.format(" (Applied minimum charge: %s)", 
                    exchangeRate.getMinimumCharge()));
        }
        
        if (exchangeRate.getMaximumCharge() != null && 
            totalCharge.compareTo(exchangeRate.getMaximumCharge()) == 0 && 
            calculatedCharge.compareTo(exchangeRate.getMaximumCharge()) > 0) {
            breakdown.append(String.format(" (Applied maximum charge: %s)", 
                    exchangeRate.getMaximumCharge()));
        }
        
        return breakdown.toString();
    }

    
    @lombok.Data
    @lombok.Builder
    public static class CurrencyConversionResult {
        private BigDecimal originalAmount;
        private String originalCurrency;
        private BigDecimal convertedAmount;
        private String convertedCurrency;
        private BigDecimal exchangeRate;
        private BigDecimal conversionCharges;
        private BigDecimal totalDebitAmount;
        private String chargeBreakdown;
    }
}
