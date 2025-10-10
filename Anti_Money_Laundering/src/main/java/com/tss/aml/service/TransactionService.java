package com.tss.aml.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.dto.compliance.EvaluationResultDto;
import com.tss.aml.dto.transaction.BalanceDto;
import com.tss.aml.dto.transaction.CurrencyConversionDto;
import com.tss.aml.dto.transaction.DepositDto;
import com.tss.aml.dto.transaction.IntercurrencyTransferDto;
import com.tss.aml.dto.transaction.TransactionDto;
import com.tss.aml.dto.transaction.TransactionInputDto;
import com.tss.aml.dto.transaction.TransferDto;
import com.tss.aml.dto.transaction.WithdrawalDto;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.BankAccount;
import com.tss.aml.entity.Case;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.User;
import com.tss.aml.entity.Enums.AccountStatus;
import com.tss.aml.entity.Enums.ApprovalStatus;
import com.tss.aml.exception.AmlApiException;
import com.tss.aml.exception.ResourceNotFoundException;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.BankAccountRepository;
import com.tss.aml.repository.CaseRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.CurrencyExchangeRepository;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository txRepo;
    private final AlertRepository alertRepo;
    private final CaseRepository caseRepo;
    private final BankAccountRepository bankAccountRepo;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final NLPService nlpService;
    private final RuleEngineService ruleEngine;
    private final ModelMapper modelMapper;
    private final SuspiciousKeywordService suspiciousKeywordService;
    private final CurrencyExchangeService currencyExchangeService;

    @Transactional
    public TransactionDto deposit(DepositDto depositDto) {
        BankAccount toAccount = bankAccountRepo.findByAccountNumber(depositDto.getToAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", depositDto.getToAccountNumber()));

        if (toAccount.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account is not approved for transactions.");
        }
        
        if (toAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account is not active for transactions.");
        }

        // STEP 1: Pre-transaction risk assessment (NO money movement yet)
        TransactionDto riskAssessment = processTransaction(null, toAccount, depositDto.getAmount(), depositDto.getCurrency(), depositDto.getDescription(), Transaction.TransactionType.DEPOSIT);
        
        // STEP 2: Handle based on risk assessment result
        if ("BLOCKED".equals(riskAssessment.getStatus())) {
            // Transaction is saved but BLOCKED - no money movement
            System.out.println("DEPOSIT BLOCKED: Transaction saved but money not deposited due to high risk score: " + riskAssessment.getCombinedRiskScore());
            return riskAssessment;
        } else if ("FLAGGED".equals(riskAssessment.getStatus())) {
            // Transaction is saved but money is NOT moved - awaiting manual approval
            System.out.println("DEPOSIT FLAGGED: Transaction saved but money not deposited. Awaiting manual approval.");
            return riskAssessment;
        } else {
            // STEP 3: Only execute money movement if APPROVED
            toAccount.setBalance(toAccount.getBalance().add(depositDto.getAmount()));
            bankAccountRepo.save(toAccount);
            System.out.println("DEPOSIT APPROVED: Money deposited successfully.");
            return riskAssessment;
        }
    }

    @Transactional
    public TransactionDto withdraw(WithdrawalDto withdrawalDto) {
        BankAccount fromAccount = bankAccountRepo.findByAccountNumber(withdrawalDto.getFromAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", withdrawalDto.getFromAccountNumber()));

        if (fromAccount.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account is not approved for transactions.");
        }
        
        if (fromAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account is not active for transactions.");
        }

        if (fromAccount.getBalance().compareTo(withdrawalDto.getAmount()) < 0) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Insufficient funds");
        }

        // STEP 1: Pre-transaction risk assessment (NO money movement yet)
        TransactionDto riskAssessment = processTransaction(fromAccount, null, withdrawalDto.getAmount(), withdrawalDto.getCurrency(), withdrawalDto.getDescription(), Transaction.TransactionType.WITHDRAWAL);
        
        // STEP 2: Handle based on risk assessment result
        if ("BLOCKED".equals(riskAssessment.getStatus())) {
            // Transaction is saved but BLOCKED - no money movement
            System.out.println("WITHDRAWAL BLOCKED: Transaction saved but money not withdrawn due to high risk score: " + riskAssessment.getCombinedRiskScore());
            return riskAssessment;
        } else if ("FLAGGED".equals(riskAssessment.getStatus())) {
            // Transaction is saved but money is NOT withdrawn - awaiting manual approval
            System.out.println("WITHDRAWAL FLAGGED: Transaction saved but money not withdrawn. Awaiting manual approval.");
            return riskAssessment;
        } else {
            // STEP 3: Only execute money movement if APPROVED
            fromAccount.setBalance(fromAccount.getBalance().subtract(withdrawalDto.getAmount()));
            bankAccountRepo.save(fromAccount);
            System.out.println("WITHDRAWAL APPROVED: Money withdrawn successfully.");
            return riskAssessment;
        }
    }

    @Transactional
    public TransactionDto transfer(TransferDto transferDto) {
        BankAccount fromAccount = bankAccountRepo.findByAccountNumber(transferDto.getFromAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", transferDto.getFromAccountNumber()));
        BankAccount toAccount = bankAccountRepo.findByAccountNumber(transferDto.getToAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", transferDto.getToAccountNumber()));

        if (fromAccount.getApprovalStatus() != ApprovalStatus.APPROVED || toAccount.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "One or both accounts are not approved for transactions.");
        }
        
        if (fromAccount.getStatus() != AccountStatus.ACTIVE || toAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "One or both accounts are not active for transactions.");
        }

        // AUTOMATIC CURRENCY DETECTION - Use sender's account currency if not provided
        String detectedCurrency = (transferDto.getCurrency() != null && !transferDto.getCurrency().trim().isEmpty()) 
                ? transferDto.getCurrency() 
                : fromAccount.getCurrency();
        
        // AUTOMATIC RECEIVER COUNTRY CODE DETECTION - Get from receiver's account owner
        String detectedReceiverCountryCode = transferDto.getReceiverCountryCode();
        if (detectedReceiverCountryCode == null || detectedReceiverCountryCode.trim().isEmpty()) {
            detectedReceiverCountryCode = getCountryCodeFromAccount(toAccount);
        }
        
        System.out.println("AUTO-DETECTED: Currency=" + detectedCurrency + ", ReceiverCountry=" + detectedReceiverCountryCode);

        // AUTOMATIC INTERCURRENCY DETECTION
        if (currencyExchangeService.isIntercurrencyTransferRequired(fromAccount, toAccount)) {
            System.out.println("INTERCURRENCY TRANSFER DETECTED: " + fromAccount.getCurrency() + " to " + toAccount.getCurrency());
            
            // Convert TransferDto to IntercurrencyTransferDto for processing
            IntercurrencyTransferDto intercurrencyDto = new IntercurrencyTransferDto();
            intercurrencyDto.setFromAccountNumber(transferDto.getFromAccountNumber());
            intercurrencyDto.setToAccountNumber(transferDto.getToAccountNumber());
            intercurrencyDto.setAmount(transferDto.getAmount());
            intercurrencyDto.setDescription(transferDto.getDescription());
            intercurrencyDto.setReceiverCountryCode(detectedReceiverCountryCode);
            
            return intercurrencyTransfer(intercurrencyDto);
        }

        // REGULAR SAME-CURRENCY TRANSFER
        if (fromAccount.getBalance().compareTo(transferDto.getAmount()) < 0) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Insufficient funds");
        }

        // STEP 1: Pre-transaction risk assessment (NO money movement yet)
        TransactionDto riskAssessment = processTransaction(fromAccount, toAccount, transferDto.getAmount(), detectedCurrency, transferDto.getDescription(), detectedReceiverCountryCode, Transaction.TransactionType.TRANSFER);
        
        // STEP 2: Handle based on risk assessment result
        if ("BLOCKED".equals(riskAssessment.getStatus())) {
            // Transaction is saved but BLOCKED - no money movement
            System.out.println("TRANSFER BLOCKED: Transaction saved but money not transferred due to high risk score: " + riskAssessment.getCombinedRiskScore());
            return riskAssessment;
        } else if ("FLAGGED".equals(riskAssessment.getStatus())) {
            // Transaction is saved but money is NOT transferred - awaiting manual approval
            System.out.println("TRANSFER FLAGGED: Transaction saved but money not transferred. Awaiting manual approval.");
            return riskAssessment;
        } else {
            // STEP 3: Only execute money movement if APPROVED
            fromAccount.setBalance(fromAccount.getBalance().subtract(transferDto.getAmount()));
            toAccount.setBalance(toAccount.getBalance().add(transferDto.getAmount()));
            bankAccountRepo.save(fromAccount);
            bankAccountRepo.save(toAccount);
            System.out.println("TRANSFER APPROVED: Money transferred successfully.");
            return riskAssessment;
        }
    }

    // Overloaded method for transfers with receiver country code
    private TransactionDto processTransaction(BankAccount from, BankAccount to, BigDecimal amount, String currency, String desc, String receiverCountryCode, Transaction.TransactionType type) {
        // Use database-driven suspicious keyword analysis instead of NLP
        int nlp = suspiciousKeywordService.calculateRiskScore(desc);
        System.out.println("Database-driven keyword risk score: " + nlp);

        // Find customer based on the account involved in the transaction
        Customer customer = findCustomerFromAccount(from, to);
        
        // Log customer info for debugging
        System.out.println("Transaction processing - Customer ID: " + customer.getId() + 
                          ", Email: " + customer.getEmail() + 
                          ", Name: " + customer.getFirstName() + " " + customer.getLastName());
        System.out.println("Basic NLP Score: " + nlp + ", Description: " + desc);

        // Use receiver country code from request, with fallback to customer's country
        String countryCode = (receiverCountryCode != null && !receiverCountryCode.trim().isEmpty()) 
                ? receiverCountryCode.trim().toUpperCase() 
                : getCountryCodeFromCustomer(customer);
        System.out.println("Receiver country code: " + countryCode + " (from request: " + receiverCountryCode + ")");
        
        return processTransactionInternal(from, to, amount, currency, desc, countryCode, nlp, customer, type);
    }
    
    // Method for deposits and withdrawals (uses customer's country)
    private TransactionDto processTransaction(BankAccount from, BankAccount to, BigDecimal amount, String currency, String desc, Transaction.TransactionType type) {
        // Use database-driven suspicious keyword analysis instead of NLP
        int nlp = suspiciousKeywordService.calculateRiskScore(desc);
        System.out.println("Database-driven keyword risk score: " + nlp);

        // Find customer based on the account involved in the transaction
        Customer customer = findCustomerFromAccount(from, to);
        
        // Log customer info for debugging
        System.out.println("Transaction processing - Customer ID: " + customer.getId() + 
                          ", Email: " + customer.getEmail() + 
                          ", Name: " + customer.getFirstName() + " " + customer.getLastName());
        System.out.println("Basic NLP Score: " + nlp + ", Description: " + desc);

        // Get country code from customer's address (for deposits/withdrawals)
        String countryCode = getCountryCodeFromCustomer(customer);
        System.out.println("Customer country: " + countryCode);
        
        return processTransactionInternal(from, to, amount, currency, desc, countryCode, nlp, customer, type);
    }
    
    // Internal method that does the actual transaction processing
    private TransactionDto processTransactionInternal(BankAccount from, BankAccount to, BigDecimal amount, String currency, String desc, String countryCode, int nlp, Customer customer, Transaction.TransactionType type) {
        
        var input = TransactionInputDto.builder()
                .txId("TEMP-" + UUID.randomUUID().toString())
                .customerId(customer.getId().toString())
                .amount(amount)
                .countryCode(countryCode)
                .nlpScore(nlp)
                .text(desc)
                .transactionType(type)
                .fromAccountNumber(from != null ? from.getAccountNumber() : null)
                .toAccountNumber(to != null ? to.getAccountNumber() : null)
                .build();
        
        System.out.println("Calling rule engine with input: " + input.getCustomerId() + ", Amount: " + input.getAmount() + ", Country: " + countryCode);
        EvaluationResultDto ruleResult = ruleEngine.evaluate(input);
        System.out.println("Rule engine result - Total Risk Score: " + ruleResult.getTotalRiskScore());

        int combined = (int) (0.6*ruleResult.getTotalRiskScore() + 0.4*nlp);        
        System.out.println("Combined Risk Score (max of NLP and Rule): " + combined + " (NLP: " + nlp + ", Rule: " + ruleResult.getTotalRiskScore() + ")");

        String status = (combined >= 90) ? "BLOCKED" : (combined >= 60) ? "FLAGGED" : "APPROVED";
        boolean exceeds = combined >= 60;

        Transaction tx = Transaction.builder()
                .transactionType(type)
                .fromAccountNumber(from != null ? from.getAccountNumber() : null)
                .toAccountNumber(to != null ? to.getAccountNumber() : null)
                .customerId(customer.getId())
                .amount(amount)
                .currency(currency)
                .description(desc)
                .nlpScore(nlp)
                .ruleEngineScore(ruleResult.getTotalRiskScore())
                .combinedRiskScore(combined)
                .thresholdExceeded(exceeds)
                .status(status)
                .transactionReference(generateTransactionReference(type))
                .build();
        Transaction savedTx = txRepo.save(tx);

        if (exceeds) {
            Alert alert = new Alert();
            alert.setTransactionId(savedTx.getId());
            alert.setReason("Risk score of " + combined + " exceeded threshold.");
            alert.setRiskScore(combined);
            alert.setStatus(Alert.AlertStatus.OPEN);
            alertRepo.save(alert);
            savedTx.setAlertId(alert.getId().toString());
            txRepo.save(savedTx);
        }

        return modelMapper.map(savedTx, TransactionDto.class);
    }
    
    /**
     * Officer approval method for flagged and blocked transactions
     */
    @Transactional
    public TransactionDto approveTransaction(Long transactionId, String officerEmail) {
        Transaction transaction = txRepo.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));
        
        if (!"FLAGGED".equals(transaction.getStatus()) && !"BLOCKED".equals(transaction.getStatus())) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Only FLAGGED or BLOCKED transactions can be approved. Current status: " + transaction.getStatus());
        }
        
        // Update transaction status
        transaction.setStatus("APPROVED");
        Transaction savedTx = txRepo.save(transaction);
        
        // Execute the actual money movement
        executeMoneyMovement(transaction);
        
        // Close the alert and associated case
        if (transaction.getAlertId() != null) {
            Alert alert = alertRepo.findById(Long.parseLong(transaction.getAlertId()))
                    .orElse(null);
            if (alert != null) {
                alert.setStatus(Alert.AlertStatus.RESOLVED);
                alert.setResolvedBy(officerEmail);
                alert.setResolvedAt(java.time.LocalDateTime.now());
                alertRepo.save(alert);
                
                // Close associated case if exists
                Case associatedCase = caseRepo.findByAlertId(alert.getId()).orElse(null);
                if (associatedCase != null) {
                    associatedCase.setStatus(Case.CaseStatus.RESOLVED);
                    associatedCase.setUpdatedAt(java.time.LocalDateTime.now());
                    caseRepo.save(associatedCase);
                    System.out.println("Case " + associatedCase.getId() + " resolved due to transaction approval by: " + officerEmail);
                }
            }
        }
        
        System.out.println("Transaction " + transactionId + " approved by officer: " + officerEmail);
        return modelMapper.map(savedTx, TransactionDto.class);
    }
    
    /**
     * Officer rejection method for flagged and blocked transactions
     */
    @Transactional
    public TransactionDto rejectTransaction(Long transactionId, String officerEmail, String reason) {
        Transaction transaction = txRepo.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));
        
        if (!"FLAGGED".equals(transaction.getStatus()) && !"BLOCKED".equals(transaction.getStatus())) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Only FLAGGED or BLOCKED transactions can be rejected. Current status: " + transaction.getStatus());
        }
        
        // Update transaction status
        transaction.setStatus("REJECTED");
        Transaction savedTx = txRepo.save(transaction);
        
        // Close the alert and associated case
        if (transaction.getAlertId() != null) {
            Alert alert = alertRepo.findById(Long.parseLong(transaction.getAlertId()))
                    .orElse(null);
            if (alert != null) {
                alert.setStatus(Alert.AlertStatus.RESOLVED);
                alert.setResolvedBy(officerEmail);
                alert.setResolvedAt(java.time.LocalDateTime.now());
                alert.setReason(alert.getReason() + " | Rejected: " + reason);
                alertRepo.save(alert);
                
                // Close associated case if exists
                Case associatedCase = caseRepo.findByAlertId(alert.getId()).orElse(null);
                if (associatedCase != null) {
                    associatedCase.setStatus(Case.CaseStatus.RESOLVED);
                    associatedCase.setUpdatedAt(java.time.LocalDateTime.now());
                    caseRepo.save(associatedCase);
                    System.out.println("Case " + associatedCase.getId() + " resolved due to transaction rejection by: " + officerEmail + ". Reason: " + reason);
                }
            }
        }
        
        System.out.println("Transaction " + transactionId + " rejected by officer: " + officerEmail + ". Reason: " + reason);
        return modelMapper.map(savedTx, TransactionDto.class);
    }
    
    /**
     * Execute actual money movement for approved transactions
     */
    private void executeMoneyMovement(Transaction transaction) {
        if (transaction.getTransactionType() == Transaction.TransactionType.DEPOSIT) {
            BankAccount toAccount = bankAccountRepo.findByAccountNumber(transaction.getToAccountNumber())
                    .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", transaction.getToAccountNumber()));
            toAccount.setBalance(toAccount.getBalance().add(transaction.getAmount()));
            bankAccountRepo.save(toAccount);
            System.out.println("Money deposited: " + transaction.getAmount() + " to account " + transaction.getToAccountNumber());
            
        } else if (transaction.getTransactionType() == Transaction.TransactionType.WITHDRAWAL) {
            BankAccount fromAccount = bankAccountRepo.findByAccountNumber(transaction.getFromAccountNumber())
                    .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", transaction.getFromAccountNumber()));
            
            if (fromAccount.getBalance().compareTo(transaction.getAmount()) < 0) {
                throw new AmlApiException(HttpStatus.BAD_REQUEST, "Insufficient funds for withdrawal");
            }
            
            fromAccount.setBalance(fromAccount.getBalance().subtract(transaction.getAmount()));
            bankAccountRepo.save(fromAccount);
            System.out.println("Money withdrawn: " + transaction.getAmount() + " from account " + transaction.getFromAccountNumber());
            
        } else if (transaction.getTransactionType() == Transaction.TransactionType.TRANSFER) {
            BankAccount fromAccount = bankAccountRepo.findByAccountNumber(transaction.getFromAccountNumber())
                    .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", transaction.getFromAccountNumber()));
            BankAccount toAccount = bankAccountRepo.findByAccountNumber(transaction.getToAccountNumber())
                    .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", transaction.getToAccountNumber()));
            
            if (fromAccount.getBalance().compareTo(transaction.getAmount()) < 0) {
                throw new AmlApiException(HttpStatus.BAD_REQUEST, "Insufficient funds for transfer");
            }
            
            fromAccount.setBalance(fromAccount.getBalance().subtract(transaction.getAmount()));
            toAccount.setBalance(toAccount.getBalance().add(transaction.getAmount()));
            bankAccountRepo.save(fromAccount);
            bankAccountRepo.save(toAccount);
            System.out.println("Money transferred: " + transaction.getAmount() + " from " + transaction.getFromAccountNumber() + " to " + transaction.getToAccountNumber());
        }
    }
    
    /**
     * Find customer based on the bank account involved in the transaction
     */
    private Customer findCustomerFromAccount(BankAccount fromAccount, BankAccount toAccount) {
        // For deposits: use toAccount owner
        // For withdrawals: use fromAccount owner  
        // For transfers: use fromAccount owner (the one initiating the transfer)
        
        BankAccount primaryAccount = fromAccount != null ? fromAccount : toAccount;
        User accountOwner = primaryAccount.getUser();
        
        // Find customer by email (since User and Customer share the same email)
        return customerRepository.findByEmail(accountOwner.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "email", accountOwner.getEmail()));
    }
    
    /**
     * Find customer by account number
     */
    public Customer findCustomerByAccountNumber(String accountNumber) {
        BankAccount account = bankAccountRepo.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", accountNumber));
        
        User accountOwner = account.getUser();
        return customerRepository.findByEmail(accountOwner.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "email", accountOwner.getEmail()));
    }
    
    /**
     * Get country code from customer's address with fallback logic
     */
    private String getCountryCodeFromCustomer(Customer customer) {
        // Check if customer has address with country information
        if (customer.getAddress() != null && customer.getAddress().getCountry() != null) {
            String country = customer.getAddress().getCountry().trim();
            
            // Convert country name to country code if needed
            String countryCode = convertCountryNameToCode(country);
            if (countryCode != null) {
                return countryCode;
            }
            
            // If it's already a 2-letter code, return as is
            if (country.length() == 2) {
                return country.toUpperCase();
            }
        }
        
        // Fallback to a default country code (you can change this based on your business logic)
        System.out.println("Warning: No country found for customer " + customer.getId() + ", using default 'US'");
        return "US"; // Default fallback
    }
    
    /**
     * Convert common country names to ISO country codes
     */
    private String convertCountryNameToCode(String countryName) {
        if (countryName == null || countryName.trim().isEmpty()) {
            return null;
        }
        
        String country = countryName.toLowerCase().trim();
        
        // Common country name to code mappings
        return switch (country) {
            case "united states", "usa", "america" -> "US";
            case "united kingdom", "uk", "britain" -> "GB";
            case "canada" -> "CA";
            case "australia" -> "AU";
            case "germany" -> "DE";
            case "france" -> "FR";
            case "japan" -> "JP";
            case "china" -> "CN";
            case "india" -> "IN";
            case "brazil" -> "BR";
            case "russia" -> "RU";
            case "south africa" -> "ZA";
            case "mexico" -> "MX";
            case "italy" -> "IT";
            case "spain" -> "ES";
            case "netherlands" -> "NL";
            case "switzerland" -> "CH";
            case "austria" -> "AT";
            case "belgium" -> "BE";
            case "sweden" -> "SE";
            case "norway" -> "NO";
            case "denmark" -> "DK";
            case "finland" -> "FI";
            case "poland" -> "PL";
            case "portugal" -> "PT";
            case "greece" -> "GR";
            case "turkey" -> "TR";
            case "egypt" -> "EG";
            case "nigeria" -> "NG";
            case "kenya" -> "KE";
            case "south korea" -> "KR";
            case "thailand" -> "TH";
            case "vietnam" -> "VN";
            case "singapore" -> "SG";
            case "malaysia" -> "MY";
            case "indonesia" -> "ID";
            case "philippines" -> "PH";
            case "argentina" -> "AR";
            case "chile" -> "CL";
            case "colombia" -> "CO";
            case "peru" -> "PE";
            case "venezuela" -> "VE";
            case "afghanistan" -> "AF";
            case "albania" -> "AL";
            case "angola" -> "AO";
            default -> null; // Return null if country name not recognized
        };
    }
    
    // Old calculateBasicNlpScore method removed - now using database-driven SuspiciousKeywordService
    
    public List<TransactionDto> getTransactionHistory(String usernameOrEmail) {
        User user = findUserByUsernameOrEmail(usernameOrEmail);
        List<BankAccount> userAccounts = bankAccountRepo.findByUserId(user.getId());
        
        // Get account numbers for this user
        List<String> accountNumbers = userAccounts.stream()
                .map(BankAccount::getAccountNumber)
                .collect(Collectors.toList());
        
        // Find transactions where user's accounts are involved
        return txRepo.findByFromAccountNumberInOrToAccountNumberInOrderByCreatedAtDesc(accountNumbers, accountNumbers)
                .stream()
                .map(tx -> modelMapper.map(tx, TransactionDto.class))
                .collect(Collectors.toList());
    }
    
    public List<TransactionDto> getAccountTransactionHistory(String accountNumber, String usernameOrEmail) {
        User user = findUserByUsernameOrEmail(usernameOrEmail);
        BankAccount account = bankAccountRepo.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", accountNumber));
        
        // Verify account belongs to user
        if (!account.getUser().getId().equals(user.getId())) {
            throw new AmlApiException(HttpStatus.FORBIDDEN, "Access denied to this account");
        }
        
        // Find transactions for this specific account
        return txRepo.findByFromAccountNumberOrToAccountNumberOrderByCreatedAtDesc(accountNumber, accountNumber)
                .stream()
                .map(tx -> modelMapper.map(tx, TransactionDto.class))
                .collect(Collectors.toList());
    }
    
    public BalanceDto getAccountBalance(String accountNumber, String usernameOrEmail) {
        User user = findUserByUsernameOrEmail(usernameOrEmail);
        BankAccount account = bankAccountRepo.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", accountNumber));
        
        // Verify account belongs to user
        if (!account.getUser().getId().equals(user.getId())) {
            throw new AmlApiException(HttpStatus.FORBIDDEN, "Access denied to this account");
        }
        
        return new BalanceDto(
                account.getAccountNumber(),
                account.getBalance(),
                account.getCurrency(),
                account.getAccountType().toString(),
                account.getStatus().toString()
        );
    }
    
    public TransactionDto getTransactionStatus(Long transactionId, String usernameOrEmail) {
        User user = findUserByUsernameOrEmail(usernameOrEmail);
        Transaction transaction = txRepo.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));
        
        // Get user's account numbers
        List<BankAccount> userAccounts = bankAccountRepo.findByUserId(user.getId());
        List<String> userAccountNumbers = userAccounts.stream()
                .map(BankAccount::getAccountNumber)
                .collect(Collectors.toList());
        
        // Verify transaction belongs to user
        boolean belongsToUser = false;
        if (transaction.getFromAccountNumber() != null && userAccountNumbers.contains(transaction.getFromAccountNumber())) {
            belongsToUser = true;
        }
        if (transaction.getToAccountNumber() != null && userAccountNumbers.contains(transaction.getToAccountNumber())) {
            belongsToUser = true;
        }
        
        if (!belongsToUser) {
            throw new AmlApiException(HttpStatus.FORBIDDEN, "Access denied to this transaction");
        }
        
        return modelMapper.map(transaction, TransactionDto.class);
    }
    
    /**
     * Helper method to find user by username or email
     */
    private User findUserByUsernameOrEmail(String usernameOrEmail) {
        // First try to find by username
        return userRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> 
                    // If not found by username, try by email
                    userRepository.findByEmail(usernameOrEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "username/email", usernameOrEmail))
                );
    }

    /**
     * Get country code from bank account owner's address
     */
    private String getCountryCodeFromAccount(BankAccount account) {
        try {
            User user = account.getUser();
            if (user != null) {
                Customer customer = customerRepository.findByEmail(user.getEmail()).orElse(null);
                if (customer != null && customer.getAddress() != null && customer.getAddress().getCountry() != null) {
                    String country = customer.getAddress().getCountry().trim();
                    // Convert country name to country code using existing method
                    String countryCode = convertCountryNameToCode(country);
                    return countryCode != null ? countryCode : "US"; // Fallback to US if not recognized
                }
            }
        } catch (Exception e) {
            System.out.println("Error getting country code from account: " + e.getMessage());
        }
        return "US"; // Default fallback
    }

    /**
     * INTERCURRENCY TRANSFER - Main method for currency conversion transfers
     */
    @Transactional
    public TransactionDto intercurrencyTransfer(IntercurrencyTransferDto transferDto) {
        BankAccount fromAccount = bankAccountRepo.findByAccountNumber(transferDto.getFromAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", transferDto.getFromAccountNumber()));
        BankAccount toAccount = bankAccountRepo.findByAccountNumber(transferDto.getToAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Bank Account", "accountNumber", transferDto.getToAccountNumber()));

        // Validate account status
        if (fromAccount.getApprovalStatus() != ApprovalStatus.APPROVED || toAccount.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "One or both accounts are not approved for transactions.");
        }
        
        if (fromAccount.getStatus() != AccountStatus.ACTIVE || toAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "One or both accounts are not active for transactions.");
        }

        // Validate different currencies
        if (!currencyExchangeService.isIntercurrencyTransferRequired(fromAccount, toAccount)) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Both accounts have the same currency. Use regular transfer instead.");
        }

        // Calculate conversion details
        CurrencyExchangeService.CurrencyConversionResult conversionResult = 
                currencyExchangeService.calculateConversion(
                    fromAccount.getCurrency(), 
                    toAccount.getCurrency(), 
                    transferDto.getAmount()
                );

        // Validate sufficient funds (including conversion charges)
        currencyExchangeService.validateSufficientFunds(fromAccount, conversionResult.getTotalDebitAmount());

        // Enhanced description with conversion details
        String enhancedDescription = String.format("%s | Conversion: %s %s → %s %s (Rate: %s, Charges: %s %s)", 
                transferDto.getDescription() != null ? transferDto.getDescription() : "Intercurrency Transfer",
                conversionResult.getOriginalAmount(), conversionResult.getOriginalCurrency(),
                conversionResult.getConvertedAmount(), conversionResult.getConvertedCurrency(),
                conversionResult.getExchangeRate(),
                conversionResult.getConversionCharges(), conversionResult.getOriginalCurrency()
        );

        // STEP 1: Pre-transaction risk assessment (NO money movement yet)
        TransactionDto riskAssessment = processIntercurrencyTransaction(
                fromAccount, toAccount, conversionResult, enhancedDescription, transferDto.getReceiverCountryCode()
        );
        
        // STEP 2: Handle based on risk assessment result
        if ("BLOCKED".equals(riskAssessment.getStatus())) {
            System.out.println("INTERCURRENCY TRANSFER BLOCKED: Transaction saved but money not transferred due to high risk score: " + riskAssessment.getCombinedRiskScore());
            return riskAssessment;
        } else if ("FLAGGED".equals(riskAssessment.getStatus())) {
            System.out.println("INTERCURRENCY TRANSFER FLAGGED: Transaction saved but money not transferred. Awaiting manual approval.");
            return riskAssessment;
        } else {
            // STEP 3: Only execute money movement if APPROVED
            // Debit original amount + charges from sender
            fromAccount.setBalance(fromAccount.getBalance().subtract(conversionResult.getTotalDebitAmount()));
            // Credit converted amount to receiver
            toAccount.setBalance(toAccount.getBalance().add(conversionResult.getConvertedAmount()));
            
            bankAccountRepo.save(fromAccount);
            bankAccountRepo.save(toAccount);
            
            System.out.println("INTERCURRENCY TRANSFER APPROVED: Money transferred successfully with conversion.");
            System.out.println("Debited: " + conversionResult.getTotalDebitAmount() + " " + conversionResult.getOriginalCurrency());
            System.out.println("Credited: " + conversionResult.getConvertedAmount() + " " + conversionResult.getConvertedCurrency());
            
            return riskAssessment;
        }
    }

    /**
     * Currency conversion calculator - for preview purposes
     */
    public CurrencyConversionDto calculateCurrencyConversion(CurrencyConversionDto conversionDto) {
        try {
            CurrencyExchangeService.CurrencyConversionResult result = 
                    currencyExchangeService.calculateConversion(
                        conversionDto.getFromCurrency(), 
                        conversionDto.getToCurrency(), 
                        conversionDto.getAmount()
                    );

            // Map result to DTO
            conversionDto.setOriginalAmount(result.getOriginalAmount());
            conversionDto.setOriginalCurrency(result.getOriginalCurrency());
            conversionDto.setConvertedAmount(result.getConvertedAmount());
            conversionDto.setConvertedCurrency(result.getConvertedCurrency());
            conversionDto.setExchangeRate(result.getExchangeRate());
            conversionDto.setConversionCharges(result.getConversionCharges());
            conversionDto.setTotalDebitAmount(result.getTotalDebitAmount());
            conversionDto.setChargeBreakdown(result.getChargeBreakdown());
            conversionDto.setSupported(true);

            return conversionDto;
        } catch (AmlApiException e) {
            conversionDto.setSupported(false);
            return conversionDto;
        }
    }

    /**
     * Process intercurrency transaction with enhanced risk assessment
     */
    private TransactionDto processIntercurrencyTransaction(
            BankAccount fromAccount, 
            BankAccount toAccount, 
            CurrencyExchangeService.CurrencyConversionResult conversionResult,
            String description, 
            String receiverCountryCode) {
        
        // Use database-driven suspicious keyword analysis
        int nlp = suspiciousKeywordService.calculateRiskScore(description);
        System.out.println("Database-driven keyword risk score for intercurrency transfer: " + nlp);

        // Find customer based on the account involved in the transaction
        Customer customer = findCustomerFromAccount(fromAccount, toAccount);
        
        // Use receiver country code from request, with fallback to customer's country
        String countryCode = (receiverCountryCode != null && !receiverCountryCode.trim().isEmpty()) 
                ? receiverCountryCode.trim().toUpperCase() 
                : getCountryCodeFromCustomer(customer);
        
        System.out.println("Intercurrency transfer - Customer: " + customer.getEmail() + ", Country: " + countryCode);
        
        return processIntercurrencyTransactionInternal(
                fromAccount, toAccount, conversionResult, description, countryCode, nlp, customer
        );
    }

    /**
     * Internal method for intercurrency transaction processing with enhanced data storage
     */
    private TransactionDto processIntercurrencyTransactionInternal(
            BankAccount fromAccount, 
            BankAccount toAccount, 
            CurrencyExchangeService.CurrencyConversionResult conversionResult,
            String description, 
            String countryCode, 
            int nlp, 
            Customer customer) {
        
        var input = TransactionInputDto.builder()
                .txId("TEMP-" + UUID.randomUUID().toString())
                .customerId(customer.getId().toString())
                .amount(conversionResult.getOriginalAmount())
                .countryCode(countryCode)
                .nlpScore(nlp)
                .text(description)
                .transactionType(Transaction.TransactionType.INTERCURRENCY_TRANSFER)
                .fromAccountNumber(fromAccount.getAccountNumber())
                .toAccountNumber(toAccount.getAccountNumber())
                .build();

        EvaluationResultDto result = ruleEngine.evaluate(input);
        int ruleScore = result.getTotalRiskScore();
        int combinedScore = (int) (0.6*result.getTotalRiskScore() + 0.4*nlp);

        System.out.println("Intercurrency Risk Assessment - NLP: " + nlp + ", Rule Engine: " + ruleScore + ", Combined: " + combinedScore);

        String status = (combinedScore >= 90) ? "BLOCKED" : (combinedScore >= 60) ? "FLAGGED" : "APPROVED";
        String alertId = null;

        if (combinedScore > 60) {
            Alert alert = new Alert();
            alert.setReason("HIGH_RISK_INTERCURRENCY_TRANSFER: Risk score of " + combinedScore + " exceeded threshold. " +
                    "Conversion: " + conversionResult.getOriginalAmount() + " " + conversionResult.getOriginalCurrency() + 
                    " → " + conversionResult.getConvertedAmount() + " " + conversionResult.getConvertedCurrency());
            alert.setRiskScore(combinedScore);
            alert.setStatus(Alert.AlertStatus.OPEN);
            Alert savedAlert = alertRepo.save(alert);
            alertId = savedAlert.getId().toString();
        }

        // Create transaction with intercurrency-specific data
        Transaction transaction = Transaction.builder()
                .transactionType(Transaction.TransactionType.INTERCURRENCY_TRANSFER)
                .fromAccountNumber(fromAccount.getAccountNumber())
                .toAccountNumber(toAccount.getAccountNumber())
                .customerId(customer.getId())
                .amount(conversionResult.getOriginalAmount())
                .currency(conversionResult.getOriginalCurrency())
                .description(description)
                .status(status)
                .nlpScore(nlp)
                .ruleEngineScore(ruleScore)
                .combinedRiskScore(combinedScore)
                .thresholdExceeded(combinedScore > 70)
                .alertId(alertId)
                .transactionReference(generateTransactionReference(Transaction.TransactionType.INTERCURRENCY_TRANSFER))
                // Intercurrency specific fields
                .originalAmount(conversionResult.getOriginalAmount())
                .originalCurrency(conversionResult.getOriginalCurrency())
                .convertedAmount(conversionResult.getConvertedAmount())
                .convertedCurrency(conversionResult.getConvertedCurrency())
                .exchangeRate(conversionResult.getExchangeRate())
                .conversionCharges(conversionResult.getConversionCharges())
                .totalDebitAmount(conversionResult.getTotalDebitAmount())
                .build();

        Transaction savedTransaction = txRepo.save(transaction);
        
        // Link alert to transaction if alert was created
        if (alertId != null) {
            Alert alert = alertRepo.findById(Long.parseLong(alertId)).orElse(null);
            if (alert != null) {
                alert.setTransactionId(savedTransaction.getId());
                alertRepo.save(alert);
            }
        }
        
        TransactionDto transactionDto = modelMapper.map(savedTransaction, TransactionDto.class);
        
        // Add conversion details to response
        transactionDto.setOriginalAmount(conversionResult.getOriginalAmount());
        transactionDto.setOriginalCurrency(conversionResult.getOriginalCurrency());
        transactionDto.setConvertedAmount(conversionResult.getConvertedAmount());
        transactionDto.setConvertedCurrency(conversionResult.getConvertedCurrency());
        transactionDto.setExchangeRate(conversionResult.getExchangeRate());
        transactionDto.setConversionCharges(conversionResult.getConversionCharges());
        transactionDto.setTotalDebitAmount(conversionResult.getTotalDebitAmount());
        transactionDto.setChargeBreakdown(conversionResult.getChargeBreakdown());

        return transactionDto;
    }
    
    /**
     * Generate transaction reference based on transaction type
     */
    private String generateTransactionReference(Transaction.TransactionType type) {
        String prefix;
        switch (type) {
            case DEPOSIT:
                prefix = "DEP";
                break;
            case WITHDRAWAL:
                prefix = "WDL";
                break;
            case TRANSFER:
                prefix = "TRF";
                break;
            case INTERCURRENCY_TRANSFER:
                prefix = "ICT";
                break;
            default:
                prefix = "TXN";
                break;
        }
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
