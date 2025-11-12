# Anti-Money Laundering (AML) Monitoring System

A comprehensive Anti-Money Laundering monitoring system built with Spring Boot backend and Angular frontend, designed to detect, monitor, and manage suspicious financial activities in real-time.
 For the full execution guide covering flows and role-specific features, see the [Full Execution Guide](docs/README_FULL.md).

## 🏗️ Architecture Overview

This system follows a modern microservices-inspired architecture with:
- **Backend**: Spring Boot 3.5.6 REST API with JWT authentication
- **Frontend**: Angular 17 with Material Design 3 UI
- **Database**: MySQL with comprehensive AML schema
- **File Storage**: Cloudinary for document management
- **Security**: Role-based access control (Customer, Admin, Compliance Officer)

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Customer, Admin, Compliance Officer)
- Secure registration with OTP verification
- Email integration for notifications and OTP delivery

### 👥 Customer Management
- Multi-step registration with document upload (Aadhaar/PAN cards)
- Admin approval workflow for new accounts
- KYC (Know Your Customer) document management
- Customer dashboard with account overview and transaction history

### 🛡️ Admin Panel
- Customer account approval/rejection system
- User management and role assignment
- System monitoring and statistics
- Audit log management

### 📊 AML Monitoring Engine
- Real-time transaction monitoring against configurable rules
- Suspicious activity detection and alerting
- Case management system for investigations
- Rule engine with customizable conditions and thresholds

### 📈 Compliance Dashboard
- Alert monitoring and prioritization
- Performance metrics and reporting
- Investigation case tracking
- Compliance reporting tools

### 📄 Document Management
- Secure document upload and storage via Cloudinary
- Document verification during registration
- Document retrieval and download
- Audit trail for all document operations

## 🛠️ Technology Stack

### Backend
- **Framework**: Spring Boot 3.5.6
- **Language**: Java 17
- **Database**: MySQL 8.0
- **Security**: Spring Security with JWT
- **Documentation**: OpenAPI/Swagger
- **File Storage**: Cloudinary
- **Email**: SMTP (Gmail)
- **Build Tool**: Maven

### Frontend
- **Framework**: Angular 17
- **UI Library**: Angular Material 17
- **Styling**: Material Design 3 + Bootstrap 5.3
- **Charts**: Chart.js + ng2-charts
- **Notifications**: ngx-toastr
- **Build Tool**: Angular CLI

### Key Dependencies
- **Backend**: Spring Data JPA, ModelMapper, Lombok, JJWT, Spring Mail
- **Frontend**: RxJS, TypeScript 5.2, Zone.js

## 📁 Project Structure

```
AML_BACKUP/
├── Anti_Money_Laundering/          # Spring Boot Backend
│   ├── src/main/java/com/tss/aml/
│   │   ├── config/                 # Configuration classes
│   │   ├── controller/             # REST API endpoints
│   │   ├── dto/                    # Data Transfer Objects
│   │   ├── entity/                 # JPA Entities
│   │   ├── exception/              # Custom exceptions
│   │   ├── repository/             # Data repositories
│   │   ├── security/               # Security configuration
│   │   ├── service/                # Business logic
│   │   └── util/                   # Utility classes
│   ├── src/main/resources/
│   │   ├── application.properties  # Application configuration
│   │   └── db/                     # Database scripts
│   └── pom.xml                     # Maven dependencies
├── aml-frontend/                   # Angular Frontend
│   ├── src/app/
│   │   ├── core/                   # Core services and guards
│   │   ├── features/               # Feature modules
│   │   │   ├── auth/               # Authentication module
│   │   │   ├── admin/              # Admin panel module
│   │   │   ├── customer/           # Customer dashboard module
│   │   │   └── compliance/         # Compliance dashboard module
│   │   └── shared/                 # Shared components
│   ├── angular.json                # Angular configuration
│   └── package.json                # Node dependencies
└── AML Data/                       # Database schema and sample data
    ├── aml_*.sql                  # Database table schemas
    └── sample_data.sql             # Sample AML data
```

## 🗄️ Database Schema

The system includes comprehensive database tables for AML monitoring:

- **aml_users**: User accounts with roles
- **aml_customers**: Customer information and KYC status
- **aml_customer_documents**: Document storage metadata
- **aml_transaction**: Transaction records
- **aml_alert**: Suspicious activity alerts
- **aml_cases**: Investigation cases
- **aml_rule**: AML monitoring rules
- **aml_rule_condition**: Rule conditions and thresholds
- **aml_audit_log**: System audit trail
- **aml_bank_account**: Bank account information
- **aml_country_risk**: Country risk ratings
- **aml_currency_exchange**: Currency exchange rates
- **aml_suspicious_keywords**: Suspicious keyword database
- **aml_rule_execution_log**: Rule execution history

## 🚀 Getting Started

### Prerequisites
- **Java**: JDK 17 or higher
- **Node.js**: v18 or higher
- **MySQL**: 8.0 or higher
- **Maven**: 3.6 or higher
- **Angular CLI**: 17.x

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AML_BACKUP
   ```

2. **Database Setup**
   - Create MySQL database: `aml`
   - Set environment variables:
     ```bash
     export db_username=your_mysql_username
     export db_password=your_mysql_password
     export email=your_gmail_address
     export email_password=your_gmail_app_password
     ```

3. **Backend Setup**
   ```bash
   cd Anti_Money_Laundering
   mvn clean install
   mvn spring-boot:run
   ```
   - API will be available at: `http://localhost:8080`
   - Swagger documentation: `http://localhost:8080/swagger-ui.html`

4. **Frontend Setup**
   ```bash
   cd ../aml-frontend
   npm install
   ng serve
   ```
   - Application will be available at: `http://localhost:4200`

### Default Credentials

**Admin User:**
- Email: admin@example.com
- Password: admin123
- Role: ADMIN

**Demo Customer:**
- Email: customer@example.com
- Password: customer123
- Role: CUSTOMER

## 🔧 Configuration

### Backend Configuration (`application.properties`)

Key configuration options:
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/aml
spring.datasource.username=${db_username}
spring.datasource.password=${db_password}

# JWT
app.jwt-secret=your-jwt-secret-key
app.jwt-expiration-milliseconds=3600000

# Email (Gmail SMTP)
spring.mail.username=${email}
spring.mail.password=${email_password}

# Cloudinary (File Storage)
cloudinary.cloud_name=your-cloud-name
cloudinary.api_key=your-api-key
cloudinary.api_secret=your-api-secret

# Google reCAPTCHA
recaptcha.secret=your-recaptcha-secret
```

### Frontend Configuration

The frontend includes proxy configuration for API calls during development (`proxy.conf.json`).

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/forgot-password` - Password reset request

### Customer Management
- `GET /api/customers/profile` - Get customer profile
- `PUT /api/customers/profile` - Update customer profile
- `GET /api/customers/documents` - Get customer documents
- `POST /api/customers/documents` - Upload documents

### Admin Panel
- `GET /api/admin/customers/pending` - Get pending customer approvals
- `POST /api/admin/customers/{id}/approve` - Approve customer
- `POST /api/admin/customers/{id}/reject` - Reject customer
- `GET /api/admin/users` - Get all users
- `GET /api/admin/statistics` - Get system statistics

### AML Monitoring
- `GET /api/compliance/alerts` - Get alerts
- `POST /api/compliance/cases` - Create investigation case
- `GET /api/compliance/rules` - Get AML rules
- `POST /api/compliance/rules` - Create/update rules

## 🔒 Security Features

- **JWT Authentication**: Stateless authentication with refresh tokens
- **Role-Based Access Control**: Three-tier permission system
- **Input Validation**: Comprehensive validation using Bean Validation
- **CORS Configuration**: Secure cross-origin resource sharing
- **Password Encryption**: BCrypt password hashing
- **Audit Logging**: Complete audit trail for all operations
- **reCAPTCHA Integration**: Bot protection for registration

## 📊 AML Rule Engine

The system includes a sophisticated rule engine that monitors transactions against:

- **Transaction Amount Thresholds**: Large transaction detection
- **Velocity Checks**: Multiple transactions in short timeframes
- **Geographic Risk**: Transactions from high-risk countries
- **Behavioral Patterns**: Unusual transaction patterns
- **Keyword Monitoring**: Suspicious transaction descriptions
- **Peer Group Analysis**: Transactions outside normal customer behavior

Rules are configurable through the admin panel and can be enabled/disabled dynamically.

## 🔍 Monitoring & Logging

- **Application Logs**: Structured logging with different levels
- **Audit Logs**: Complete audit trail stored in database
- **Performance Monitoring**: Response times and error tracking
- **Rule Execution Logs**: Detailed rule evaluation history
- **User Activity Tracking**: Login/logout and activity monitoring

## 🧪 Testing

### Backend Testing
```bash
cd Anti_Money_Laundering
mvn test
```

### Frontend Testing
```bash
cd aml-frontend
ng test
```

## 🚀 Deployment

### Backend Deployment
```bash
mvn clean package
java -jar target/Anti_Money_Laundering-0.0.1-SNAPSHOT.jar
```

### Frontend Deployment
```bash
ng build --configuration production
# Deploy the dist/ folder to your web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

## 🔄 Version History

- **v1.0.0**: Initial release with core AML monitoring features
- Comprehensive customer onboarding and admin approval workflow
- Real-time transaction monitoring and alerting system
- Role-based access control and secure document management

---

**Note**: This system is designed for demonstration and educational purposes. In production environments, additional security measures, compliance certifications, and legal reviews would be required.
