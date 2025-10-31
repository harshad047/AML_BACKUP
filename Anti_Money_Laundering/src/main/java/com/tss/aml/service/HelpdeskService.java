package com.tss.aml.service;

import com.tss.aml.dto.helpdesk.CreateMessageRequest;
import com.tss.aml.dto.helpdesk.CreateTicketRequest;
import com.tss.aml.dto.helpdesk.HelpdeskMessageDto;
import com.tss.aml.dto.helpdesk.HelpdeskTicketDto;
import com.tss.aml.dto.helpdesk.RespondTicketRequest;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.HelpdeskMessage;
import com.tss.aml.entity.HelpdeskTicket;
import com.tss.aml.entity.Role;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.User;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.HelpdeskMessageRepository;
import com.tss.aml.repository.HelpdeskTicketRepository;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HelpdeskService {

    private final HelpdeskTicketRepository ticketRepository;
    private final HelpdeskMessageRepository messageRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final AlertRepository alertRepository;

    @Transactional
    public HelpdeskTicketDto createTicket(Long transactionId, String username, CreateTicketRequest req) {
        User customerUser = getUserByUsernameOrEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Customer customerEntity = getCustomerByUsernameOrEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        // Validate ownership using Customer.id since Transaction.customerId references Customer
        if (tx.getCustomerId() == null) {
            throw new IllegalStateException("Transaction has no customer assigned (customerId is null)");
        }
        if (!tx.getCustomerId().equals(customerEntity.getId())) {
            throw new SecurityException("You are not allowed to raise a ticket for this transaction (tx.customerId="
                    + tx.getCustomerId() + ", resolvedCustomerId=" + customerEntity.getId() + ")");
        }

        // Allow tickets only for DEPOSIT and WITHDRAWAL, not for TRANSFER or INTERCURRENCY_TRANSFER
        Transaction.TransactionType type = tx.getTransactionType();
        if (type == Transaction.TransactionType.TRANSFER || type == Transaction.TransactionType.INTERCURRENCY_TRANSFER) {
            throw new IllegalStateException("Tickets can only be raised for deposits and withdrawals");
        }

        String status = tx.getStatus() == null ? "" : tx.getStatus();
        if (!("BLOCKED".equalsIgnoreCase(status) || "FLAGGED".equalsIgnoreCase(status) || "PENDING_REVIEW".equalsIgnoreCase(status))) {
            throw new IllegalStateException("Tickets can only be raised for blocked/flagged transactions");
        }

        HelpdeskTicket ticket = HelpdeskTicket.builder()
                .transaction(tx)
                .customer(customerUser)
                .subject(req.getSubject())
                .message(req.getMessage())
                .status(HelpdeskTicket.TicketStatus.OPEN)
                .build();

        // optional auto-assign: try assign to officer linked to alert, else first available officer
        List<Alert> alerts = alertRepository.findByTransactionId(transactionId);
        if (!alerts.isEmpty()) {
            String resolvedBy = alerts.get(0).getResolvedBy();
            if (resolvedBy != null) {
                userRepository.findByEmail(resolvedBy).ifPresent(ticket::setAssignedOfficer);
            }
        }
        if (ticket.getAssignedOfficer() == null) {
            List<User> officers = userRepository.findByRole(Role.OFFICER);
            if (!officers.isEmpty()) {
                ticket.setAssignedOfficer(officers.get(0));
            }
        }

        ticket = ticketRepository.save(ticket);

        // create initial customer message as part of the thread
        HelpdeskMessage initial = HelpdeskMessage.builder()
                .ticket(ticket)
                .author(customerUser)
                .senderType(HelpdeskMessage.SenderType.CUSTOMER)
                .content(req.getMessage())
                .build();
        messageRepository.save(initial);

        return toDto(ticket);
    }

    @Transactional(readOnly = true)
    public Page<HelpdeskTicketDto> getMyTickets(String username, Integer page, Integer size, String status) {
        User customer = getUserByUsernameOrEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Pageable pageable = PageRequest.of(page, size);
        Page<HelpdeskTicket> ticketsPage;
        if (status != null) {
            ticketsPage = ticketRepository.findByCustomerAndStatusOrderByCreatedAtDesc(customer, HelpdeskTicket.TicketStatus.valueOf(status), pageable);
        } else {
            ticketsPage = ticketRepository.findByCustomerOrderByCreatedAtDesc(customer, pageable);
        }
        return ticketsPage.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<HelpdeskTicketDto> getTicketsForTransactionAsCustomer(Long transactionId, String username) {
        User customer = getUserByUsernameOrEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<HelpdeskTicket> tickets = ticketRepository.findByTransaction_IdOrderByCreatedAtDesc(transactionId);
        return tickets.stream()
                .filter(t -> t.getCustomer() != null && t.getCustomer().getId().equals(customer.getId()))
                .map(this::toDto)
                .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public Page<HelpdeskTicketDto> getOpenTicketsForOfficers(Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size);
        // Return all tickets (OPEN, RESPONDED, RESOLVED) for compliance officers to manage
        // Frontend will handle filtering by status
        Page<HelpdeskTicket> tickets = ticketRepository.findAllByOrderByCreatedAtDesc(pageable);
        return tickets.map(this::toDto);
    }

    @Transactional
    public HelpdeskTicketDto respondToTicket(Long ticketId, String officerUsername, RespondTicketRequest req) {
        User officer = getUserByUsernameOrEmail(officerUsername)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found"));
        if (officer.getRole() != Role.OFFICER && officer.getRole() != Role.ADMIN && officer.getRole() != Role.SUPER_ADMIN) {
            throw new SecurityException("Only compliance officers can respond to tickets");
        }

        HelpdeskTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        ticket.setAssignedOfficer(officer);
        ticket.setStatus(HelpdeskTicket.TicketStatus.RESPONDED);

        ticket = ticketRepository.save(ticket);

        HelpdeskMessage reply = HelpdeskMessage.builder()
                .ticket(ticket)
                .author(officer)
                .senderType(HelpdeskMessage.SenderType.OFFICER)
                .content(req.getResponse())
                .build();
        messageRepository.save(reply);
        return toDto(ticket);
    }

    @Transactional
    public HelpdeskTicketDto resolveTicket(Long ticketId, String officerUsername) {
        User officer = getUserByUsernameOrEmail(officerUsername)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found"));
        if (officer.getRole() != Role.OFFICER && officer.getRole() != Role.ADMIN && officer.getRole() != Role.SUPER_ADMIN) {
            throw new SecurityException("Only compliance officers can resolve tickets");
        }
        HelpdeskTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        ticket.setStatus(HelpdeskTicket.TicketStatus.RESOLVED);
        ticket = ticketRepository.save(ticket);
        return toDto(ticket);
    }

    private Optional<User> getUserByUsernameOrEmail(String usernameOrEmail) {
        Optional<User> byUsername = userRepository.findByUsername(usernameOrEmail);
        if (byUsername.isPresent()) return byUsername;
        return userRepository.findByEmail(usernameOrEmail);
    }

    private Optional<Customer> getCustomerByUsernameOrEmail(String usernameOrEmail) {
        Optional<Customer> byUsername = customerRepository.findByUsername(usernameOrEmail);
        if (byUsername.isPresent()) return byUsername;
        return customerRepository.findByEmail(usernameOrEmail);
    }

    private HelpdeskTicketDto toDto(HelpdeskTicket t) {
        return HelpdeskTicketDto.builder()
                .id(t.getId())
                .transactionId(t.getTransaction() != null ? t.getTransaction().getId() : null)
                .customerId(t.getCustomer() != null ? t.getCustomer().getId() : null)
                .assignedOfficerId(t.getAssignedOfficer() != null ? t.getAssignedOfficer().getId() : null)
                .subject(t.getSubject())
                .message(t.getMessage())
                .status(t.getStatus() != null ? t.getStatus().name() : null)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    @Transactional
    public HelpdeskMessageDto addMessage(Long ticketId, String authorUsername, CreateMessageRequest req) {
        User author = getUserByUsernameOrEmail(authorUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        HelpdeskTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        // authorization: customer or officer/admin can post
        boolean isOwner = ticket.getCustomer() != null && ticket.getCustomer().getId().equals(author.getId());
        boolean isOfficer = author.getRole() == Role.OFFICER || author.getRole() == Role.ADMIN || author.getRole() == Role.SUPER_ADMIN;
        if (!isOwner && !isOfficer) {
            throw new SecurityException("Not authorized to post messages on this ticket");
        }
        HelpdeskMessage.SenderType senderType = isOwner ? HelpdeskMessage.SenderType.CUSTOMER : HelpdeskMessage.SenderType.OFFICER;
        HelpdeskMessage msg = HelpdeskMessage.builder()
                .ticket(ticket)
                .author(author)
                .senderType(senderType)
                .content(req.getContent())
                .build();
        msg = messageRepository.save(msg);
        // Mark ticket responded if officer posted
        if (senderType == HelpdeskMessage.SenderType.OFFICER) {
            ticket.setAssignedOfficer(author);
            ticket.setStatus(HelpdeskTicket.TicketStatus.RESPONDED);
            ticketRepository.save(ticket);
        }
        return toDto(msg);
    }

    @Transactional(readOnly = true)
    public Page<HelpdeskMessageDto> getMessages(Long ticketId, Integer page, Integer size, String username) {
        HelpdeskTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        // simple visibility: owner or officer/admin can read
        Optional<User> userOpt = getUserByUsernameOrEmail(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            boolean isOwner = ticket.getCustomer() != null && ticket.getCustomer().getId().equals(user.getId());
            boolean isOfficer = user.getRole() == Role.OFFICER || user.getRole() == Role.ADMIN || user.getRole() == Role.SUPER_ADMIN;
            if (!isOwner && !isOfficer) {
                throw new SecurityException("Not authorized to view messages");
            }
        }
        Pageable pageable = PageRequest.of(page, size);
        Page<HelpdeskMessage> pageMsgs = messageRepository.findByTicket_IdOrderByCreatedAtAsc(ticketId, pageable);
        return pageMsgs.map(this::toDto);
    }

    private HelpdeskMessageDto toDto(HelpdeskMessage m) {
        return HelpdeskMessageDto.builder()
                .id(m.getId())
                .ticketId(m.getTicket() != null ? m.getTicket().getId() : null)
                .authorId(m.getAuthor() != null ? m.getAuthor().getId() : null)
                .senderType(m.getSenderType() != null ? m.getSenderType().name() : null)
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
