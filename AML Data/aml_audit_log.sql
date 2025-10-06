-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: aml
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(255) DEFAULT NULL,
  `details` text,
  `timestamp` datetime(6) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,'USER_REGISTERED','New customer registered: Rishit Rathod (rishit.rathod@tssconsultancy.com)','2025-10-04 08:42:22.535695','rishit_rathod'),(2,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: REGISTRATION_SUCCESS','2025-10-04 08:44:53.542202','anonymousUser'),(3,'LOGIN','User logged in from IP: 127.0.0.1 at 2025-10-04T14:15:51.061255600','2025-10-04 08:45:51.061256','rishit_rathod'),(4,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: LOGIN_SUCCESS','2025-10-04 08:45:55.112031','rishit_rathod'),(5,'ACCOUNT_CREATED','Bank account created: AC-266953','2025-10-04 08:46:44.651068','rishit_rathod'),(6,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 08:46:48.595233','rishit_rathod'),(7,'LOGIN','User logged in from IP: 127.0.0.1 at 2025-10-04T14:17:48.455992','2025-10-04 08:47:48.455992','admin_user'),(8,'EMAIL_SENT','Email sent to: admin2@aml.com, Type: LOGIN_SUCCESS','2025-10-04 08:47:52.425362','admin_user'),(9,'ACCOUNT_APPROVED','Approved bank account: AC-266953 for user: rishit_rathod','2025-10-04 08:48:28.595136','ADMIN'),(10,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_APPROVAL','2025-10-04 08:48:32.560805','admin_user'),(11,'ACCOUNT_CREATED','Bank account created: AC-615551','2025-10-04 09:07:49.380286','rishit_rathod'),(12,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 09:07:53.465265','rishit_rathod'),(13,'ACCOUNT_APPROVED','Approved bank account: AC-615551 for user: rishit_rathod','2025-10-04 09:08:52.236627','ADMIN'),(14,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_APPROVAL','2025-10-04 09:08:56.272782','admin_user'),(15,'ACCOUNT_CREATED','Bank account created: AC-714652','2025-10-04 09:11:58.227640','rishit_rathod'),(16,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 09:12:02.203814','rishit_rathod'),(17,'ACCOUNT_APPROVED','Approved bank account: AC-714652 for user: rishit_rathod','2025-10-04 09:12:18.491979','ADMIN'),(18,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_APPROVAL','2025-10-04 09:12:22.436261','admin_user'),(19,'ACCOUNT_CREATED','Bank account created: AC-844815','2025-10-04 09:13:00.447212','rishit_rathod'),(20,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 09:13:04.692492','rishit_rathod'),(21,'ACCOUNT_APPROVED','Approved bank account: AC-844815 for user: rishit_rathod','2025-10-04 09:13:22.358633','ADMIN'),(22,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_APPROVAL','2025-10-04 09:13:26.303875','admin_user'),(23,'ACCOUNT_CREATED','Bank account created: AC-192615','2025-10-04 09:16:09.265119','rishit_rathod'),(24,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 09:16:13.296145','rishit_rathod'),(25,'ACCOUNT_APPROVED','Approved bank account: AC-192615 for user: rishit_rathod','2025-10-04 09:16:35.773331','ADMIN'),(26,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_APPROVAL','2025-10-04 09:16:39.694245','admin_user'),(27,'ACCOUNT_SUSPENDED','Suspended bank account: AC-192615 for user: rishit_rathod','2025-10-04 09:17:17.757268','ADMIN'),(28,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_SUSPENSION','2025-10-04 09:17:21.662109','admin_user'),(29,'ACCOUNT_CREATED','Bank account created: AC-490899','2025-10-04 09:19:37.024307','rishit_rathod'),(30,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 09:19:41.176128','rishit_rathod'),(31,'ACCOUNT_CREATED','Bank account created: AC-181345','2025-10-04 09:31:34.983862','rishit_rathod'),(32,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 09:31:39.125494','rishit_rathod'),(33,'ACCOUNT_CREATED','Bank account created: Pending deposit of 0 INR for account AC-929797','2025-10-04 09:34:13.088279','rishit_rathod'),(34,'ACCOUNT_CREATED','Bank account created: AC-929797','2025-10-04 09:34:13.097966','rishit_rathod'),(35,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 09:34:17.032336','rishit_rathod'),(36,'ACCOUNT_CREATED','Bank account created: Pending deposit of 0 INR for account AC-532181','2025-10-04 09:37:32.877207','rishit_rathod'),(37,'ACCOUNT_CREATED','Bank account created: AC-532181','2025-10-04 09:37:32.890223','rishit_rathod'),(38,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 09:37:36.730438','rishit_rathod'),(39,'ACCOUNT_CREATED','Bank account created: AC-831905','2025-10-04 09:39:47.864321','rishit_rathod'),(40,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 09:39:51.792024','rishit_rathod'),(41,'ACCOUNT_CREATED','Bank account created: AC-347502 with initial balance: 0','2025-10-04 09:44:08.141641','rishit_rathod'),(42,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 09:44:12.284244','rishit_rathod'),(43,'LOGIN','User logged in from IP: 127.0.0.1 at 2025-10-04T15:16:59.505290400','2025-10-04 09:46:59.505290','rishit_rathod'),(44,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: LOGIN_SUCCESS','2025-10-04 09:47:03.872494','rishit_rathod'),(45,'ACCOUNT_CREATED','Bank account created: AC-269655 with initial balance: 0','2025-10-04 09:47:24.346182','rishit_rathod'),(46,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 09:47:28.308819','rishit_rathod'),(47,'ACCOUNT_CREATED','Bank account created: AC-850718 with initial balance: 10000','2025-10-04 09:49:00.522449','rishit_rathod'),(48,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_CREATION_REQUEST','2025-10-04 09:49:04.570163','rishit_rathod'),(49,'LOGIN','User logged in from IP: 127.0.0.1 at 2025-10-04T15:19:34.030013400','2025-10-04 09:49:34.030013','admin_user'),(50,'EMAIL_SENT','Email sent to: admin2@aml.com, Type: LOGIN_SUCCESS','2025-10-04 09:49:38.088725','admin_user'),(51,'ACCOUNT_REJECTED','Rejected bank account: AC-269655 for user: rishit_rathod. Reason: Account rejected by admin','2025-10-04 09:50:23.075625','ADMIN'),(52,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: ACCOUNT_REJECTION','2025-10-04 09:50:27.004611','admin_user'),(53,'USER_CREATED','Created new user: john_smith_co with role: COMPLIANCE_OFFICER','2025-10-04 09:58:14.611751','ADMIN'),(54,'COMPLIANCE_OFFICER_ADDED','Added compliance officer: john_smith_co','2025-10-04 09:58:14.625502','ADMIN'),(55,'EMAIL_SENT','Email sent to: john.smith@company.com, Type: COMPLIANCE_OFFICER_ADDED','2025-10-04 09:58:18.738317','admin_user'),(56,'LOGIN','User logged in from IP: 127.0.0.1 at 2025-10-04T15:29:11.167532','2025-10-04 09:59:11.167532','john_smith_co'),(57,'EMAIL_SENT','Email sent to: john.smith@company.com, Type: LOGIN_SUCCESS','2025-10-04 09:59:15.184149','john_smith_co'),(58,'LOGIN','User logged in from IP: 127.0.0.1 at 2025-10-06T09:39:41.346256200','2025-10-06 04:09:41.347279','rishit_rathod'),(59,'EMAIL_SENT','Email sent to: rishit.rathod@tssconsultancy.com, Type: LOGIN_SUCCESS','2025-10-06 04:09:47.624889','rishit_rathod'),(60,'LOGIN','User logged in from IP: 127.0.0.1 at 2025-10-06T09:41:18.241776700','2025-10-06 04:11:18.241777','harshad_panchani'),(61,'EMAIL_SENT','Email sent to: harshadkumar.panchani119400@marwadiuniversity.ac.in, Type: LOGIN_SUCCESS','2025-10-06 04:11:22.707768','harshad_panchani');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-06 14:11:58
