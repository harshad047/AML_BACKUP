package com.tss.aml.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tss.aml.entity.BankAccount;
import com.tss.aml.entity.User;
import com.tss.aml.entity.Enums.AccountStatus;
import com.tss.aml.entity.Enums.ApprovalStatus;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    List<BankAccount> findByUserId(Long userId);
    List<BankAccount> findByUser(User user);
    Optional<BankAccount> findByAccountNumber(String accountNumber);
    List<BankAccount> findByApprovalStatus(ApprovalStatus approvalStatus);
    List<BankAccount> findByStatus(AccountStatus status);
}
