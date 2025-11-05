package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.account.BankAccountDto;
import com.tss.aml.dto.admin.AdminCustomerDetailsDto;
import com.tss.aml.dto.admin.CreateUserDto;
import com.tss.aml.dto.admin.UserDto;
import com.tss.aml.dto.compliance.CountryRiskDto;
import com.tss.aml.dto.compliance.RuleDto;
import com.tss.aml.dto.compliance.SuspiciousKeywordDto;
import com.tss.aml.dto.transaction.TransactionDto;

public interface IAdminService {
	 // User Management
    List<UserDto> getAllUsers();
    List<UserDto> getActiveCustomers();
    UserDto createUser(CreateUserDto createUserDto);

    // Customer Details
    AdminCustomerDetailsDto getCustomerDetailsForAdmin(Long userId);

    // Rule Management
    List<RuleDto> getAllRules();
    RuleDto getRuleById(Long id);
    RuleDto createRule(RuleDto ruleDto);
    RuleDto updateRule(Long id, RuleDto ruleDto);
    RuleDto toggleRuleStatus(Long id, boolean isActive);
    void deleteRule(Long id);

    // Suspicious Keyword Management
    List<SuspiciousKeywordDto> getAllKeywords();
    SuspiciousKeywordDto addKeyword(SuspiciousKeywordDto keywordDto);
    SuspiciousKeywordDto updateKeyword(Long id, SuspiciousKeywordDto keywordDto);
    void deleteKeyword(Long id);

    // Country Risk Management
    List<CountryRiskDto> getAllCountryRisks();
    CountryRiskDto createCountryRisk(CountryRiskDto dto);
    CountryRiskDto updateCountryRisk(Long id, CountryRiskDto dto);
    void deleteCountryRisk(Long id);

    // Transaction Management
    List<TransactionDto> getAdminTransactions(String status);
    List<TransactionDto> getTransactionsByAccountNumber(String accountNumber);

    // Bank Account Management
    List<BankAccountDto> getPendingAccounts();
    BankAccountDto approveAccount(Long accountId);
    BankAccountDto rejectAccount(Long accountId);
    BankAccountDto suspendAccount(Long accountId);
    BankAccountDto activateAccount(Long accountId);
    BankAccountDto getAccountById(Long accountId);
    List<BankAccountDto> getAllAccounts();

    // Compliance Officer Management
    List<UserDto> getComplianceOfficers();
    UserDto addComplianceOfficer(Long userId);
    UserDto removeComplianceOfficer(Long userId);
    UserDto createComplianceOfficer(CreateUserDto createUserDto);

    // Customer Blocking Management
    UserDto blockCustomer(Long userId, String reason);
    UserDto unblockCustomer(Long userId);
    List<UserDto> getBlockedCustomers();
}
