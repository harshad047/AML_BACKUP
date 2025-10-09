package com.tss.aml.repository;

import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Document;
import com.tss.aml.entity.Enums.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByCustomer(Customer customer);
    List<Document> findByCustomerId(Long customerId);
    List<Document> findByStatus(DocumentStatus status);
}
