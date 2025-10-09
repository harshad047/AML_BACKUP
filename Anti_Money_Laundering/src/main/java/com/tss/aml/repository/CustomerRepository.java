package com.tss.aml.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Enums.KycStatus;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByUsername(String username);

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    long countByKycStatus(KycStatus kycStatus);
}
