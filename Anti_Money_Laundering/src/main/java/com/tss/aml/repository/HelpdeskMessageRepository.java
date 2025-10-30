package com.tss.aml.repository;

import com.tss.aml.entity.HelpdeskMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HelpdeskMessageRepository extends JpaRepository<HelpdeskMessage, Long> {
    Page<HelpdeskMessage> findByTicket_IdOrderByCreatedAtAsc(Long ticketId, Pageable pageable);
}
