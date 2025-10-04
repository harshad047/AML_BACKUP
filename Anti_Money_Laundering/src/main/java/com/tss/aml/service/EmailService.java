package com.tss.aml.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private AuditLogService auditLogService;

    public void sendLoginSuccessEmailHtml(String toEmail) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            String loginTime = LocalDateTime.now().format(formatter);

            String htmlContent = """
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                            .container { max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                            h2 { color: #333333; }
                            p { color: #555555; line-height: 1.5; }
                            .details { background-color: #f9f9f9; border-left: 4px solid #007bff; margin: 20px 0; padding: 15px; }
                            .security-note { font-size: 14px; color: #777777; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>Successful Login to Your Account</h2>
                            <p>Hello,</p>
                            <p>This is a security notification to confirm a successful login to your account.</p>
                            <div class="details">
                                <strong>Time:</strong> """ + loginTime + """
                                <br>
                                <strong>Approximate Location:</strong> Rajkot, Gujarat, India
                            </div>
                            <p class="security-note">If you did not initiate this login, please change your password immediately and contact our support team.</p>
                        </div>
                    </body>
                </html>
            """;

            helper.setTo(toEmail);
            helper.setSubject("Security Alert: Successful Login to Your Account");
            helper.setText(htmlContent, true); 

            mailSender.send(mimeMessage);
            auditLogService.logEmailSent(toEmail, "LOGIN_SUCCESS");
            log.info("HTML Login success email sent to {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send HTML login success email to {}", toEmail, e);
        }
    }
    
    public void sendRegistrationSuccessEmail(String toEmail) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            // HTML template without username
            String htmlTemplate = """
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                            .container { max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                            h2 { color: #28a745; }
                            p { color: #555555; line-height: 1.5; }
                            .status { background-color: #fff3cd; border-left: 4px solid #ffc107; margin: 20px 0; padding: 15px; font-weight: bold; }
                            .cta-button { display: inline-block; background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>Welcome!</h2>
                            <p>Thank you for registering. Your account has been created successfully.</p>
                            <div class="status">
                                Your current status: KYC document upload pending.
                            </div>
                            <p>Please log in to your account and proceed to the dashboard to upload the necessary documents to fully activate your account.</p>
                            <a href="http://127.0.0.1:5500/login.html" class="cta-button">Go to Login</a>
                        </div>
                    </body>
                </html>
            """;

            helper.setTo(toEmail);
            helper.setSubject("Welcome! Your Registration was Successful");
            helper.setText(htmlTemplate, true); // set HTML content

            mailSender.send(mimeMessage);
            auditLogService.logEmailSent(toEmail, "REGISTRATION_SUCCESS");
            log.info("Registration success email sent to {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send registration success email to {}", toEmail, e);
        }
    }

    public void sendBankAccountCreationRequestEmail(String toEmail, String accountNumber) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String htmlContent = """
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                            .container { max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                            h2 { color: #007bff; }
                            p { color: #555555; line-height: 1.5; }
                            .account-info { background-color: #e7f3ff; border-left: 4px solid #007bff; margin: 20px 0; padding: 15px; }
                            .status { background-color: #fff3cd; border-left: 4px solid #ffc107; margin: 20px 0; padding: 15px; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>Bank Account Creation Request Submitted</h2>
                            <p>Dear Customer,</p>
                            <p>Your bank account creation request has been successfully submitted and is now under review.</p>
                            <div class="account-info">
                                <strong>Account Number:</strong> """ + accountNumber + """
                                <br>
                                <strong>Request Date:</strong> """ + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + """
                            </div>
                            <div class="status">
                                Status: Pending Admin Approval
                            </div>
                            <p>Our compliance team will review your request and you will be notified via email once a decision has been made.</p>
                            <p>Thank you for choosing our services.</p>
                        </div>
                    </body>
                </html>
            """;

            helper.setTo(toEmail);
            helper.setSubject("Bank Account Creation Request - Pending Approval");
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            auditLogService.logEmailSent(toEmail, "ACCOUNT_CREATION_REQUEST");
            log.info("Bank account creation request email sent to {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send bank account creation request email to {}", toEmail, e);
        }
    }

    public void sendBankAccountApprovalEmail(String toEmail, String accountNumber, String customerName) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String htmlContent = """
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                            .container { max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                            h2 { color: #28a745; }
                            p { color: #555555; line-height: 1.5; }
                            .account-info { background-color: #d4edda; border-left: 4px solid #28a745; margin: 20px 0; padding: 15px; }
                            .cta-button { display: inline-block; background-color: #28a745; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>🎉 Bank Account Approved!</h2>
                            <p>Dear """ + customerName + """
                            <p>Congratulations! Your bank account has been approved and is now active.</p>
                            <div class="account-info">
                                <strong>Account Number:</strong> """ + accountNumber + """
                                <br>
                                <strong>Status:</strong> Active
                                <br>
                                <strong>Approved Date:</strong> """ + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + """
                            </div>
                            <p>You can now start using your account for transactions. Please log in to your dashboard to access all account features.</p>
                            <a href="http://127.0.0.1:5500/login.html" class="cta-button">Access Your Account</a>
                        </div>
                    </body>
                </html>
            """;

            helper.setTo(toEmail);
            helper.setSubject("✅ Bank Account Approved - Welcome to Our Services!");
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            auditLogService.logEmailSent(toEmail, "ACCOUNT_APPROVAL");
            log.info("Bank account approval email sent to {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send bank account approval email to {}", toEmail, e);
        }
    }

    public void sendBankAccountRejectionEmail(String toEmail, String accountNumber, String customerName, String reason) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String htmlContent = """
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                            .container { max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                            h2 { color: #dc3545; }
                            p { color: #555555; line-height: 1.5; }
                            .account-info { background-color: #f8d7da; border-left: 4px solid #dc3545; margin: 20px 0; padding: 15px; }
                            .reason { background-color: #fff3cd; border-left: 4px solid #ffc107; margin: 20px 0; padding: 15px; }
                            .cta-button { display: inline-block; background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>Bank Account Application Status</h2>
                            <p>Dear """ + customerName + """
                            <p>We regret to inform you that your bank account application has been declined after careful review.</p>
                            <div class="account-info">
                                <strong>Account Number:</strong> """ + accountNumber + """
                                <br>
                                <strong>Status:</strong> Rejected
                                <br>
                                <strong>Decision Date:</strong> """ + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + """
                            </div>
                            """ + (reason != null && !reason.trim().isEmpty() ? 
                            "<div class=\"reason\"><strong>Reason:</strong> " + reason + "</div>" : "") + """
                            <p>If you believe this decision was made in error or if you have additional documentation to support your application, please contact our customer support team.</p>
                            <a href="mailto:support@amlbank.com" class="cta-button">Contact Support</a>
                        </div>
                    </body>
                </html>
            """;

            helper.setTo(toEmail);
            helper.setSubject("Bank Account Application - Decision Notification");
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            auditLogService.logEmailSent(toEmail, "ACCOUNT_REJECTION");
            log.info("Bank account rejection email sent to {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send bank account rejection email to {}", toEmail, e);
        }
    }

    public void sendAccountSuspensionEmail(String toEmail, String accountNumber, String customerName, String reason) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String htmlContent = """
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                            .container { max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                            h2 { color: #dc3545; }
                            p { color: #555555; line-height: 1.5; }
                            .account-info { background-color: #f8d7da; border-left: 4px solid #dc3545; margin: 20px 0; padding: 15px; }
                            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; margin: 20px 0; padding: 15px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>⚠️ Account Suspension Notice</h2>
                            <p>Dear """ + customerName + """
                            <p>Your bank account has been temporarily suspended due to compliance requirements.</p>
                            <div class="account-info">
                                <strong>Account Number:</strong> """ + accountNumber + """
                                <br>
                                <strong>Status:</strong> Suspended
                                <br>
                                <strong>Suspension Date:</strong> """ + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + """
                            </div>
                            """ + (reason != null && !reason.trim().isEmpty() ? 
                            "<div class=\"warning\"><strong>Reason:</strong> " + reason + "</div>" : "") + """
                            <p>During the suspension period, you will not be able to perform transactions on this account. Please contact our compliance team for further assistance.</p>
                            <p>We apologize for any inconvenience caused.</p>
                        </div>
                    </body>
                </html>
            """;

            helper.setTo(toEmail);
            helper.setSubject("⚠️ Important: Account Suspension Notice");
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            auditLogService.logEmailSent(toEmail, "ACCOUNT_SUSPENSION");
            log.info("Account suspension email sent to {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send account suspension email to {}", toEmail, e);
        }
    }

    public void sendAccountActivationEmail(String toEmail, String accountNumber, String customerName) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String htmlContent = """
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                            .container { max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                            h2 { color: #28a745; }
                            p { color: #555555; line-height: 1.5; }
                            .account-info { background-color: #d4edda; border-left: 4px solid #28a745; margin: 20px 0; padding: 15px; }
                            .cta-button { display: inline-block; background-color: #28a745; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>✅ Account Reactivated</h2>
                            <p>Dear """ + customerName + """
                            <p>Good news! Your bank account has been reactivated and is now fully operational.</p>
                            <div class="account-info">
                                <strong>Account Number:</strong> """ + accountNumber + """
                                <br>
                                <strong>Status:</strong> Active
                                <br>
                                <strong>Reactivation Date:</strong> """ + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + """
                            </div>
                            <p>You can now resume all banking activities including transactions, transfers, and other services.</p>
                            <a href="http://127.0.0.1:5500/login.html" class="cta-button">Access Your Account</a>
                        </div>
                    </body>
                </html>
            """;

            helper.setTo(toEmail);
            helper.setSubject("✅ Account Reactivated - Welcome Back!");
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            auditLogService.logEmailSent(toEmail, "ACCOUNT_ACTIVATION");
            log.info("Account activation email sent to {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send account activation email to {}", toEmail, e);
        }
    }

    public void sendComplianceOfficerAddedEmail(String toEmail, String officerName) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String htmlContent = """
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                            .container { max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                            h2 { color: #007bff; }
                            p { color: #555555; line-height: 1.5; }
                            .role-info { background-color: #e7f3ff; border-left: 4px solid #007bff; margin: 20px 0; padding: 15px; }
                            .cta-button { display: inline-block; background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>Welcome to the Compliance Team!</h2>
                            <p>Dear """ + officerName + """
                            <p>You have been assigned the role of Compliance Officer in our AML system.</p>
                            <div class="role-info">
                                <strong>Role:</strong> Compliance Officer
                                <br>
                                <strong>Assigned Date:</strong> """ + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + """
                                <br>
                                <strong>Responsibilities:</strong> Monitor transactions, review alerts, investigate suspicious activities
                            </div>
                            <p>You now have access to compliance tools and can review flagged transactions and customer activities.</p>
                            <a href="http://127.0.0.1:5500/login.html" class="cta-button">Access Compliance Dashboard</a>
                        </div>
                    </body>
                </html>
            """;

            helper.setTo(toEmail);
            helper.setSubject("Welcome to the Compliance Team - Role Assignment");
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            auditLogService.logEmailSent(toEmail, "COMPLIANCE_OFFICER_ADDED");
            log.info("Compliance officer added email sent to {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send compliance officer added email to {}", toEmail, e);
        }
    }

    public void sendComplianceOfficerRemovedEmail(String toEmail, String officerName) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String htmlContent = """
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                            .container { max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                            h2 { color: #dc3545; }
                            p { color: #555555; line-height: 1.5; }
                            .role-info { background-color: #f8d7da; border-left: 4px solid #dc3545; margin: 20px 0; padding: 15px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>Role Change Notification</h2>
                            <p>Dear """ + officerName + """
                            <p>Your role as Compliance Officer has been revoked from our AML system.</p>
                            <div class="role-info">
                                <strong>Previous Role:</strong> Compliance Officer
                                <br>
                                <strong>Revoked Date:</strong> """ + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + """
                            </div>
                            <p>You no longer have access to compliance tools and monitoring features. If you have any questions, please contact the system administrator.</p>
                        </div>
                    </body>
                </html>
            """;

            helper.setTo(toEmail);
            helper.setSubject("Role Change - Compliance Officer Access Revoked");
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            auditLogService.logEmailSent(toEmail, "COMPLIANCE_OFFICER_REMOVED");
            log.info("Compliance officer removed email sent to {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send compliance officer removed email to {}", toEmail, e);
        }
    }

}
