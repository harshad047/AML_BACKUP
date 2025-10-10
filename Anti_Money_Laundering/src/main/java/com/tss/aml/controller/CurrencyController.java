package com.tss.aml.controller;

import com.tss.aml.dto.CurrencyConversionDto;
import com.tss.aml.service.CurrencyExchangeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyExchangeService currencyExchangeService;

    /**
     * Get all supported currency pairs - Public endpoint
     */
    @GetMapping("/supported-pairs")
    public ResponseEntity<List<String>> getSupportedCurrencyPairs() {
        return ResponseEntity.ok(currencyExchangeService.getSupportedCurrencyPairs());
    }

    /**
     * Calculate currency conversion with charges - Customer endpoint
     */
    @PostMapping("/conversion/calculate")
    @PreAuthorize("hasAnyAuthority('ROLE_CUSTOMER', 'CUSTOMER')")
    public ResponseEntity<CurrencyConversionDto> calculateConversion(@RequestBody CurrencyConversionDto conversionDto) {
        try {
            CurrencyExchangeService.CurrencyConversionResult result = 
                    currencyExchangeService.calculateConversion(
                        conversionDto.getFromCurrency(), 
                        conversionDto.getToCurrency(), 
                        conversionDto.getAmount()
                    );

            // Map result to DTO
            conversionDto.setOriginalAmount(result.getOriginalAmount());
            conversionDto.setOriginalCurrency(result.getOriginalCurrency());
            conversionDto.setConvertedAmount(result.getConvertedAmount());
            conversionDto.setConvertedCurrency(result.getConvertedCurrency());
            conversionDto.setExchangeRate(result.getExchangeRate());
            conversionDto.setConversionCharges(result.getConversionCharges());
            conversionDto.setTotalDebitAmount(result.getTotalDebitAmount());
            conversionDto.setChargeBreakdown(result.getChargeBreakdown());
            conversionDto.setSupported(true);

            return ResponseEntity.ok(conversionDto);
        } catch (Exception e) {
            conversionDto.setSupported(false);
            return ResponseEntity.ok(conversionDto);
        }
    }

    /**
     * Check if currency pair is supported
     */
    @GetMapping("/supported/{fromCurrency}/{toCurrency}")
    @PreAuthorize("hasAnyAuthority('ROLE_CUSTOMER', 'CUSTOMER')")
    public ResponseEntity<Boolean> isCurrencyPairSupported(
            @PathVariable String fromCurrency, 
            @PathVariable String toCurrency) {
        boolean supported = currencyExchangeService.isCurrencyPairSupported(fromCurrency, toCurrency);
        return ResponseEntity.ok(supported);
    }
}
