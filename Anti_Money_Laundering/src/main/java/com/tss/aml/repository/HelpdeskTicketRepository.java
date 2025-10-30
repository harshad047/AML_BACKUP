package com.tss.aml.repository;

import com.tss.aml.entity.HelpdeskTicket;
import com.tss.aml.entity.HelpdeskTicket.TicketStatus;
import com.tss.aml.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HelpdeskTicketRepository extends JpaRepository<HelpdeskTicket, Long> {
    // Lists
    List<HelpdeskTicket> findByTransaction_IdOrderByCreatedAtDesc(Long transactionId);

    // Pageable variants
    Page<HelpdeskTicket> findByCustomerOrderByCreatedAtDesc(User customer, Pageable pageable);
    Page<HelpdeskTicket> findByCustomerAndStatusOrderByCreatedAtDesc(User customer, TicketStatus status, Pageable pageable);
    Page<HelpdeskTicket> findByAssignedOfficerOrderByCreatedAtDesc(User assignedOfficer, Pageable pageable);
    Page<HelpdeskTicket> findByAssignedOfficerAndStatusOrderByCreatedAtDesc(User assignedOfficer, TicketStatus status, Pageable pageable);
    Page<HelpdeskTicket> findByStatusOrderByCreatedAtDesc(TicketStatus status, Pageable pageable);
    Page<HelpdeskTicket> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
