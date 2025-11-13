package com.tss.aml.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tss.aml.entity.HelpdeskTicket;
import com.tss.aml.entity.User;
import com.tss.aml.entity.Enums.TicketStatus;

@Repository
public interface HelpdeskTicketRepository extends JpaRepository<HelpdeskTicket, Long> {
    List<HelpdeskTicket> findByTransaction_IdOrderByCreatedAtDesc(Long transactionId);

    Page<HelpdeskTicket> findByCustomerOrderByCreatedAtDesc(User customer, Pageable pageable);
    Page<HelpdeskTicket> findByCustomerAndStatusOrderByCreatedAtDesc(User customer, TicketStatus status, Pageable pageable);
    Page<HelpdeskTicket> findByAssignedOfficerOrderByCreatedAtDesc(User assignedOfficer, Pageable pageable);
    Page<HelpdeskTicket> findByAssignedOfficerAndStatusOrderByCreatedAtDesc(User assignedOfficer, TicketStatus status, Pageable pageable);
    Page<HelpdeskTicket> findByStatusOrderByCreatedAtDesc(TicketStatus status, Pageable pageable);
    Page<HelpdeskTicket> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
