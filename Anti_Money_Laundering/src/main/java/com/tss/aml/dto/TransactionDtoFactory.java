package com.tss.aml.dto;

import com.tss.aml.entity.Transaction;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

/**
 * Factory class to create appropriate TransactionDto based on transaction type
 */
@Component
public class TransactionDtoFactory {
    
    private final ModelMapper modelMapper;
    
    public TransactionDtoFactory(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }
    
    /**
     * Creates the appropriate DTO based on transaction type
     */
    public BaseTransactionDto createTransactionDto(Transaction transaction) {
        if (transaction == null) {
            return null;
        }
        
        BaseTransactionDto dto;
        
        // Determine DTO type based on transaction type
        if (Transaction.TransactionType.INTERCURRENCY_TRANSFER.equals(transaction.getTransactionType())) {
            dto = modelMapper.map(transaction, IntercurrencyTransactionDto.class);
        } else {
            // For DEPOSIT, WITHDRAWAL, TRANSFER
            dto = modelMapper.map(transaction, RegularTransactionDto.class);
        }
        
        return dto;
    }
    
    /**
     * Creates RegularTransactionDto for non-intercurrency transactions
     */
    public RegularTransactionDto createRegularTransactionDto(Transaction transaction) {
        return modelMapper.map(transaction, RegularTransactionDto.class);
    }
    
    /**
     * Creates IntercurrencyTransactionDto for intercurrency transactions
     */
    public IntercurrencyTransactionDto createIntercurrencyTransactionDto(Transaction transaction) {
        return modelMapper.map(transaction, IntercurrencyTransactionDto.class);
    }
}
