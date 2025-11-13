package com.tss.aml.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "currency_exchange")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CurrencyExchange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_currency", nullable = false, length = 3)
    private String fromCurrency;

    @Column(name = "to_currency", nullable = false, length = 3)
    private String toCurrency;

    @Column(name = "exchange_rate", nullable = false, precision = 10, scale = 6)
    private BigDecimal exchangeRate;

    @Column(name = "base_charge_percentage", nullable = false, precision = 5, scale = 4)
    private BigDecimal baseChargePercentage;

    @Column(name = "fixed_charge", nullable = false, precision = 10, scale = 2)
    private BigDecimal fixedCharge;

    @Column(name = "minimum_charge", nullable = false, precision = 10, scale = 2)
    private BigDecimal minimumCharge;

    @Column(name = "maximum_charge", precision = 10, scale = 2)
    private BigDecimal maximumCharge;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "effective_from", nullable = false)
    private LocalDateTime effectiveFrom;

    @Column(name = "effective_until")
    private LocalDateTime effectiveUntil;

    @Column(name = "rate_source", length = 100)
    private String rateSource;

    @Column(name = "last_updated_by", length = 100)
    private String lastUpdatedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    
    public BigDecimal calculateTotalCharge(BigDecimal amount) {
        BigDecimal percentageCharge = amount.multiply(baseChargePercentage);
        BigDecimal totalCharge = percentageCharge.add(fixedCharge);
        
        if (totalCharge.compareTo(minimumCharge) < 0) {
            totalCharge = minimumCharge;
        }
        
        if (maximumCharge != null && totalCharge.compareTo(maximumCharge) > 0) {
            totalCharge = maximumCharge;
        }
        
        return totalCharge;
    }

    
    public BigDecimal convertAmount(BigDecimal amount) {
        return amount.multiply(exchangeRate);
    }

    
    public boolean isCurrentlyValid() {
        LocalDateTime now = LocalDateTime.now();
        return isActive && 
               effectiveFrom.isBefore(now) && 
               (effectiveUntil == null || effectiveUntil.isAfter(now));
    }
}
