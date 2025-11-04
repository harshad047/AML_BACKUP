package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.account.BankAccountDto;
import com.tss.aml.dto.account.CreateAccountDto;

public interface IBankAccountService {

	BankAccountDto createAccount(String usernameOrEmail, CreateAccountDto createAccountDto);

	List<BankAccountDto> getAccountsForUser(String usernameOrEmail);
}
