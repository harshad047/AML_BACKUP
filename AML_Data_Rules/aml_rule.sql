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
-- Table structure for table `rule`
--

DROP TABLE IF EXISTS `rule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `priority` int NOT NULL,
  `risk_weight` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rule`
--

LOCK TABLES `rule` WRITE;
/*!40000 ALTER TABLE `rule` DISABLE KEYS */;
INSERT INTO `rule` VALUES (1,'FLAG','Transfer to high-risk country with amount > $1000',_binary '','High-Risk Country Transfer',1,70),(2,'BLOCK','Transaction description contains high-risk keywords',_binary '','High NLP Risk Score',2,90),(3,'FLAG','Urgent transfer with high amount',_binary '','Urgent Large Transfer',3,85),(4,'FLAG','Explicit mention of offshore account',_binary '','Offshore Account Mention',4,95),(5,'FLAG','Cash pickup with sub-threshold amount',_binary '','Potential Structuring',5,80),(6,'BLOCK','High-risk terrorism-related language',_binary '','Terrorism Financing',6,100),(7,'FLAG','Customer has made multiple high-value transactions in the last 24 hours',_binary '','Rapid Fund Movement',7,80),(8,'FLAG','Flag when there are repeated high-value deposits within a short time window',_binary '','High Value Deposit Velocity',1,80),(9,'BLOCK','Block when extreme count of high-value tx within window is reached',_binary '','Extreme High Value Velocity (BLOCK)',0,100),(10,'FLAG','Flag when sum of small transactions over a window exceeds threshold (possible structuring)',_binary '','Structuring Sum Over Window',2,85),(11,'FLAG','Flag when current amount exceeds user\'s 95th percentile over 90 days',_binary '','Behavioral Deviation High Amount',3,70),(12,'FLAG','Flag when transaction amount is a large share of account balance',_binary '','High Balance Impact Ratio',2,70),(13,'FLAG','Flag when cumulative amount in window exceeds threshold',_binary '','Daily Total Threshold',2,75),(14,'FLAG','Flag high-value transfer to a first-time beneficiary in lookback window',_binary '','New Counterparty High Amount',2,70);
/*!40000 ALTER TABLE `rule` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-09 17:00:48
