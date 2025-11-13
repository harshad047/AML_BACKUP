package com.tss.aml.repository;

import com.tss.aml.entity.CurrencyExchange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CurrencyExchangeRepository extends JpaRepository<CurrencyExchange, Long> {

    
    @Query("SELECT ce FROM CurrencyExchange ce WHERE " +
           "ce.fromCurrency = :fromCurrency AND ce.toCurrency = :toCurrency AND " +
           "ce.isActive = true AND ce.effectiveFrom <= :now AND " +
           "(ce.effectiveUntil IS NULL OR ce.effectiveUntil > :now) " +
           "ORDER BY ce.effectiveFrom DESC")
    Optional<CurrencyExchange> findActiveExchangeRate(
            @Param("fromCurrency") String fromCurrency,
            @Param("toCurrency") String toCurrency,
            @Param("now") LocalDateTime now);

    @Query("SELECT ce FROM CurrencyExchange ce WHERE " +
           "(ce.fromCurrency = :currency OR ce.toCurrency = :currency) AND " +
           "ce.isActive = true AND ce.effectiveFrom <= :now AND " +
           "(ce.effectiveUntil IS NULL OR ce.effectiveUntil > :now)")
    List<CurrencyExchange> findActiveRatesForCurrency(
            @Param("currency") String currency,
            @Param("now") LocalDateTime now);

    
    @Query("SELECT DISTINCT CONCAT(ce.fromCurrency, '-', ce.toCurrency) FROM CurrencyExchange ce WHERE ce.isActive = true")
    List<String> findAllSupportedCurrencyPairs();

    @Query("SELECT COUNT(ce) > 0 FROM CurrencyExchange ce WHERE " +
           "ce.fromCurrency = :fromCurrency AND ce.toCurrency = :toCurrency AND " +
           "ce.isActive = true AND ce.effectiveFrom <= :now AND " +
           "(ce.effectiveUntil IS NULL OR ce.effectiveUntil > :now)")
    boolean isCurrencyPairSupported(
            @Param("fromCurrency") String fromCurrency,
            @Param("toCurrency") String toCurrency,
            @Param("now") LocalDateTime now);
}
