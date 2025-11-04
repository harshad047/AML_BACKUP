package com.tss.aml.service;

import java.util.List;

import org.springframework.data.domain.Page;

import com.tss.aml.dto.helpdesk.CreateMessageRequest;
import com.tss.aml.dto.helpdesk.CreateTicketRequest;
import com.tss.aml.dto.helpdesk.HelpdeskMessageDto;
import com.tss.aml.dto.helpdesk.HelpdeskTicketDto;
import com.tss.aml.dto.helpdesk.RespondTicketRequest;

public interface IHelpDeskService {
	
	HelpdeskTicketDto createTicket(Long transactionId, String username, CreateTicketRequest req);
    Page<HelpdeskTicketDto> getMyTickets(String username, Integer page, Integer size, String status);
    List<HelpdeskTicketDto> getTicketsForTransactionAsCustomer(Long transactionId, String username);
    Page<HelpdeskTicketDto> getOpenTicketsForOfficers(Integer page, Integer size);
    HelpdeskTicketDto respondToTicket(Long ticketId, String officerUsername, RespondTicketRequest req);
    HelpdeskTicketDto resolveTicket(Long ticketId, String officerUsername);
    HelpdeskMessageDto addMessage(Long ticketId, String authorUsername, CreateMessageRequest req);
    Page<HelpdeskMessageDto> getMessages(Long ticketId, Integer page, Integer size, String username);
}
