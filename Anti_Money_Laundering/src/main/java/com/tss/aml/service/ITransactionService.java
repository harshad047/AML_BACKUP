package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.transaction.BalanceDto;
import com.tss.aml.dto.transaction.CurrencyConversionDto;
import com.tss.aml.dto.transaction.DepositDto;
import com.tss.aml.dto.transaction.IntercurrencyTransferDto;
import com.tss.aml.dto.transaction.TransactionDto;
import com.tss.aml.dto.transaction.TransferDto;
import com.tss.aml.dto.transaction.WithdrawalDto;

public interface ITransactionService {
	
	TransactionDto deposit(DepositDto depositDto);

    TransactionDto withdraw(WithdrawalDto withdrawalDto);

    TransactionDto transfer(TransferDto transferDto);

    TransactionDto approveTransaction(Long transactionId, String officerEmail);

    TransactionDto rejectTransaction(Long transactionId, String officerEmail, String reason);

    List<TransactionDto> getTransactionHistory(String usernameOrEmail);

    List<TransactionDto> getAccountTransactionHistory(String accountNumber, String usernameOrEmail);

    BalanceDto getAccountBalance(String accountNumber, String usernameOrEmail);

    TransactionDto getTransactionStatus(Long transactionId, String usernameOrEmail);

    TransactionDto intercurrencyTransfer(IntercurrencyTransferDto transferDto);

    CurrencyConversionDto calculateCurrencyConversion(CurrencyConversionDto conversionDto);
}
