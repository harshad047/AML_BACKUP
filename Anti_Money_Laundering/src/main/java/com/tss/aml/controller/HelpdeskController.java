package com.tss.aml.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.helpdesk.CreateMessageRequest;
import com.tss.aml.dto.helpdesk.CreateTicketRequest;
import com.tss.aml.dto.helpdesk.HelpdeskMessageDto;
import com.tss.aml.dto.helpdesk.HelpdeskTicketDto;
import com.tss.aml.dto.helpdesk.RespondTicketRequest;
import com.tss.aml.service.impl.HelpdeskServiceImpl;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/helpdesk")
@RequiredArgsConstructor
public class HelpdeskController {

    private final HelpdeskServiceImpl helpdeskService;

    // CUSTOMER: create a ticket for a blocked/flagged transaction
    @PostMapping("/transactions/{transactionId}/tickets")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<HelpdeskTicketDto> createTicket(@PathVariable Long transactionId,
                                                          @RequestBody CreateTicketRequest req,
                                                          Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(helpdeskService.createTicket(transactionId, username, req));
    }

    // CUSTOMER: list my tickets (pageable, optional status filter)
    @GetMapping("/tickets/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<HelpdeskTicketDto>> getMyTickets(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String status,
            Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(helpdeskService.getMyTickets(username, page, size, status));
    }

    // CUSTOMER: list tickets for a specific transaction (owned by me)
    @GetMapping("/transactions/{transactionId}/tickets")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<HelpdeskTicketDto>> getMyTicketsForTransaction(@PathVariable Long transactionId,
                                                                              Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(helpdeskService.getTicketsForTransactionAsCustomer(transactionId, username));
    }

    // OFFICER/ADMIN: list open tickets to triage (pageable)
    @GetMapping("/tickets/open")
    @PreAuthorize("hasAnyRole('OFFICER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Page<HelpdeskTicketDto>> getOpenTickets(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        return ResponseEntity.ok(helpdeskService.getOpenTicketsForOfficers(page, size));
    }

    // OFFICER/ADMIN: respond to a ticket
    @PostMapping("/tickets/{ticketId}/respond")
    @PreAuthorize("hasAnyRole('OFFICER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<HelpdeskTicketDto> respondToTicket(@PathVariable Long ticketId,
                                                             @RequestBody RespondTicketRequest req,
                                                             Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(helpdeskService.respondToTicket(ticketId, username, req));
    }

    // OFFICER/ADMIN: resolve a ticket
    @PostMapping("/tickets/{ticketId}/resolve")
    @PreAuthorize("hasAnyRole('OFFICER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<HelpdeskTicketDto> resolveTicket(@PathVariable Long ticketId,
                                                           Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(helpdeskService.resolveTicket(ticketId, username));
    }

    // Threaded messages: add message to a ticket (customer or officer)
    @PostMapping("/tickets/{ticketId}/messages")
    @PreAuthorize("hasAnyRole('CUSTOMER','OFFICER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<HelpdeskMessageDto> addMessage(@PathVariable Long ticketId,
                                                         @RequestBody CreateMessageRequest req,
                                                         Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(helpdeskService.addMessage(ticketId, username, req));
    }

    // Threaded messages: list messages (pageable, ascending by time)
    @GetMapping("/tickets/{ticketId}/messages")
    @PreAuthorize("hasAnyRole('CUSTOMER','OFFICER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Page<HelpdeskMessageDto>> getMessages(@PathVariable Long ticketId,
                                                                @RequestParam(defaultValue = "0") Integer page,
                                                                @RequestParam(defaultValue = "20") Integer size,
                                                                Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(helpdeskService.getMessages(ticketId, page, size, username));
    }
}
