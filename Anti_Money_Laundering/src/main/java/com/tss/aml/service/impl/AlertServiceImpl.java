package com.tss.aml.service.impl;

import com.tss.aml.dto.compliance.AlertDto;
import com.tss.aml.dto.transaction.BaseTransactionDto;
import com.tss.aml.dto.transaction.TransactionDtoFactory;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.BankAccount;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.User;
import com.tss.aml.exception.AmlApiException;
import com.tss.aml.exception.ResourceNotFoundException;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.BankAccountRepository;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.service.IAlertService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements IAlertService{

    private final AlertRepository alertRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionDtoFactory transactionDtoFactory;

    public List<AlertDto> getAlertsForCustomer(String usernameOrEmail) {
        User user = findUserByUsernameOrEmail(usernameOrEmail);

        List<BankAccount> userAccounts = bankAccountRepository.findByUserId(user.getId());
        List<String> userAccountNumbers = userAccounts.stream()
                .map(BankAccount::getAccountNumber)
                .collect(Collectors.toList());

        List<Transaction> userTransactions = transactionRepository.findByFromAccountNumberInOrToAccountNumberInOrderByCreatedAtDesc(userAccountNumbers, userAccountNumbers);

        List<Long> transactionIds = userTransactions.stream()
                .map(Transaction::getId)
                .collect(Collectors.toList());

        return alertRepository.findByTransactionIdIn(transactionIds).stream()
                .map(alert -> {
                    AlertDto dto = new AlertDto();
                    dto.setId(alert.getId());
                    dto.setTransactionId(alert.getTransactionId());
                    dto.setReason(alert.getReason());
                    dto.setRiskScore(alert.getRiskScore());
                    dto.setStatus(alert.getStatus());
                    dto.setCreatedAt(alert.getCreatedAt());

                    Transaction transaction = userTransactions.stream()
                            .filter(tx -> tx.getId().equals(alert.getTransactionId()))
                            .findFirst()
                            .orElse(null);
                    if (transaction != null) {
                        BaseTransactionDto txDto = transactionDtoFactory.createTransactionDto(transaction);
                        dto.setTransaction(txDto);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public AlertDto getAlertForCustomer(Long alertId, String usernameOrEmail) {
        User user = findUserByUsernameOrEmail(usernameOrEmail);
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", alertId));

        Transaction transaction = transactionRepository.findById(alert.getTransactionId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", alert.getTransactionId()));

        List<BankAccount> userAccounts = bankAccountRepository.findByUserId(user.getId());
        List<String> userAccountNumbers = userAccounts.stream()
                .map(BankAccount::getAccountNumber)
                .collect(Collectors.toList());

        boolean belongsToUser = false;
        if (transaction.getFromAccountNumber() != null && userAccountNumbers.contains(transaction.getFromAccountNumber())) {
            belongsToUser = true;
        }
        if (transaction.getToAccountNumber() != null && userAccountNumbers.contains(transaction.getToAccountNumber())) {
            belongsToUser = true;
        }

        if (!belongsToUser) {
            throw new AmlApiException(HttpStatus.FORBIDDEN, "Access denied to this alert");
        }

        AlertDto dto = new AlertDto();
        dto.setId(alert.getId());
        dto.setTransactionId(alert.getTransactionId());
        dto.setReason(alert.getReason());
        dto.setRiskScore(alert.getRiskScore());
        dto.setStatus(alert.getStatus());
        dto.setCreatedAt(alert.getCreatedAt());
        BaseTransactionDto txDto = transactionDtoFactory.createTransactionDto(transaction);
        dto.setTransaction(txDto);
        return dto;
    }

    public List<AlertDto> getAlertsForTransaction(Long transactionId, String usernameOrEmail) {
        User user = findUserByUsernameOrEmail(usernameOrEmail);
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        List<BankAccount> userAccounts = bankAccountRepository.findByUserId(user.getId());
        List<String> userAccountNumbers = userAccounts.stream()
                .map(BankAccount::getAccountNumber)
                .collect(Collectors.toList());

        boolean belongsToUser = false;
        if (transaction.getFromAccountNumber() != null && userAccountNumbers.contains(transaction.getFromAccountNumber())) {
            belongsToUser = true;
        }
        if (transaction.getToAccountNumber() != null && userAccountNumbers.contains(transaction.getToAccountNumber())) {
            belongsToUser = true;
        }

        if (!belongsToUser) {
            throw new AmlApiException(HttpStatus.FORBIDDEN, "Access denied to this transaction");
        }

        return alertRepository.findByTransactionId(transactionId).stream()
                .map(alert -> {
                    AlertDto dto = new AlertDto();
                    dto.setId(alert.getId());
                    dto.setTransactionId(alert.getTransactionId());
                    dto.setReason(alert.getReason());
                    dto.setRiskScore(alert.getRiskScore());
                    dto.setStatus(alert.getStatus());
                    dto.setCreatedAt(alert.getCreatedAt());
                    BaseTransactionDto txDto = transactionDtoFactory.createTransactionDto(transaction);
                    dto.setTransaction(txDto);
                    return dto;
                })
                .collect(Collectors.toList());
    }


    private User findUserByUsernameOrEmail(String usernameOrEmail) {
        return userRepository.findByUsername(usernameOrEmail)
                .orElseGet(() ->
                    userRepository.findByEmail(usernameOrEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "username/email", usernameOrEmail))
                );
    }
}
