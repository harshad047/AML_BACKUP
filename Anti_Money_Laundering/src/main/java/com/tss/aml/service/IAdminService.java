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
    List<UserDto> getAllUsers();
    List<UserDto> getActiveCustomers();
    UserDto createUser(CreateUserDto createUserDto);

    AdminCustomerDetailsDto getCustomerDetailsForAdmin(Long userId);

    List<RuleDto> getAllRules();
    RuleDto getRuleById(Long id);
    RuleDto createRule(RuleDto ruleDto);
    RuleDto updateRule(Long id, RuleDto ruleDto);
    RuleDto toggleRuleStatus(Long id, boolean isActive);
    void deleteRule(Long id);

    List<SuspiciousKeywordDto> getAllKeywords();
    SuspiciousKeywordDto addKeyword(SuspiciousKeywordDto keywordDto);
    SuspiciousKeywordDto updateKeyword(Long id, SuspiciousKeywordDto keywordDto);
    void deleteKeyword(Long id);

    List<CountryRiskDto> getAllCountryRisks();
    CountryRiskDto createCountryRisk(CountryRiskDto dto);
    CountryRiskDto updateCountryRisk(Long id, CountryRiskDto dto);
    void deleteCountryRisk(Long id);

    List<TransactionDto> getAdminTransactions(String status);
    List<TransactionDto> getTransactionsByAccountNumber(String accountNumber);

    List<BankAccountDto> getPendingAccounts();
    BankAccountDto approveAccount(Long accountId);
    BankAccountDto rejectAccount(Long accountId);
    BankAccountDto suspendAccount(Long accountId);
    BankAccountDto activateAccount(Long accountId);
    BankAccountDto getAccountById(Long accountId);
    List<BankAccountDto> getAllAccounts();

    List<UserDto> getComplianceOfficers();
    UserDto addComplianceOfficer(Long userId);
    UserDto removeComplianceOfficer(Long userId);
    UserDto createComplianceOfficer(CreateUserDto createUserDto);

    UserDto blockCustomer(Long userId, String reason);
    UserDto unblockCustomer(Long userId);
    List<UserDto> getBlockedCustomers();
}
