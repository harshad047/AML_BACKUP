package com.tss.aml.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Enums.KycStatus;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByUsername(String username);

    @Query("SELECT c.kycStatus FROM Customer c WHERE c.username = :username")
    Optional<KycStatus> findKycStatusByUsername(@Param("username") String username);

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    long countByKycStatus(KycStatus kycStatus);
}
