package com.tss.aml.repository;

import com.tss.aml.entity.BankAccount;
import com.tss.aml.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    List<BankAccount> findByUserId(Long userId);
    List<BankAccount> findByUser(User user);
    Optional<BankAccount> findByAccountNumber(String accountNumber);
    List<BankAccount> findByApprovalStatus(BankAccount.ApprovalStatus approvalStatus);
    List<BankAccount> findByStatus(BankAccount.AccountStatus status);
}
