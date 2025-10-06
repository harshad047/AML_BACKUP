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
-- Table structure for table `transaction`
--

DROP TABLE IF EXISTS `transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `alert_id` varchar(255) DEFAULT NULL,
  `amount` decimal(38,2) NOT NULL,
  `combined_risk_score` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `currency` varchar(255) NOT NULL,
  `customer_id` bigint DEFAULT NULL,
  `description` text,
  `from_account_number` varchar(255) DEFAULT NULL,
  `nlp_score` int DEFAULT NULL,
  `rule_engine_score` int DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `threshold_exceeded` bit(1) NOT NULL,
  `to_account_number` varchar(255) DEFAULT NULL,
  `transaction_type` enum('DEPOSIT','TRANSFER','WITHDRAWAL') DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction`
--

LOCK TABLES `transaction` WRITE;
/*!40000 ALTER TABLE `transaction` DISABLE KEYS */;
INSERT INTO `transaction` VALUES (1,NULL,500000.00,5,'2025-10-04 05:06:44.029896','USD',2,'Salary deposit from overseas company',NULL,10,0,'APPROVED',_binary '\0','AC-327026','DEPOSIT','2025-10-04 05:06:44.029896'),(2,NULL,2500.00,14,'2025-10-04 05:06:56.362636','USD',2,'Monthly salary payment to employee','AC-327026',28,0,'APPROVED',_binary '\0','AC-840075','TRANSFER','2025-10-04 05:06:56.362636'),(3,'3',15000.00,89,'2025-10-04 05:08:30.041576','USD',2,'Large business payment for investment','AC-327026',82,97,'FLAGGED',_binary '','AC-840075','TRANSFER','2025-10-04 05:08:30.058382'),(4,NULL,5000.00,2,'2025-10-04 06:36:44.287914','USD',2,'Monthly salary deposit',NULL,5,0,'APPROVED',_binary '\0','AC-327026','DEPOSIT','2025-10-04 06:36:44.287914'),(5,NULL,1000.00,40,'2025-10-04 06:37:11.348952','USD',2,'ATM withdrawal','AC-327026',0,80,'APPROVED',_binary '\0',NULL,'WITHDRAWAL','2025-10-04 06:37:11.348952'),(6,NULL,2500.00,47,'2025-10-04 06:37:33.342735','USD',2,'Monthly salary payment to employee','AC-327026',15,80,'APPROVED',_binary '\0','AC-840075','TRANSFER','2025-10-04 06:37:33.342735'),(7,'4',15000.00,67,'2025-10-04 06:38:28.611388','USD',2,'Large business payment for investment','AC-327026',65,70,'FLAGGED',_binary '','AC-840075','TRANSFER','2025-10-04 06:38:28.653093'),(9,NULL,50000.00,2,'2025-10-04 08:50:04.731619','INR',3,'Monthly salary deposit',NULL,5,0,'APPROVED',_binary '\0','AC-266953','DEPOSIT','2025-10-04 08:50:04.731619'),(10,NULL,0.00,0,'2025-10-04 09:34:13.078065','INR',6,'Initial deposit pending account approval: AC-929797',NULL,0,0,'PENDING_ACCOUNT_APPROVAL',_binary '\0','AC-929797','DEPOSIT','2025-10-04 09:34:13.078065'),(11,NULL,0.00,0,'2025-10-04 09:37:32.864614','INR',6,'Initial deposit pending account approval: AC-532181',NULL,0,0,'PENDING',_binary '\0','AC-532181','DEPOSIT','2025-10-04 09:37:32.864614'),(15,'9',15000.00,67,'2025-10-06 04:24:21.793930','USD',2,'Large business payment for investment','AC-327026',65,70,'FLAGGED',_binary '','AC-840075','TRANSFER','2025-10-06 04:24:21.818360');
/*!40000 ALTER TABLE `transaction` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-06 14:11:56
