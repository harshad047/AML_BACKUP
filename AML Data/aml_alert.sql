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
-- Table structure for table `alert`
--

DROP TABLE IF EXISTS `alert`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alert` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `risk_score` int NOT NULL,
  `status` enum('ESCALATED','OPEN','RESOLVED') NOT NULL,
  `transaction_id` bigint DEFAULT NULL,
  `resolved_at` datetime(6) DEFAULT NULL,
  `resolved_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alert`
--

LOCK TABLES `alert` WRITE;
/*!40000 ALTER TABLE `alert` DISABLE KEYS */;
INSERT INTO `alert` VALUES (1,'2025-10-29 07:04:03.277575','MODERATE RISK: Rule violations detected (Rule Score: 60) | Combined Score: 60 (NLP: 0, Rules: 60)',60,'ESCALATED',4,NULL,NULL),(2,'2025-10-29 07:04:08.386451','MODERATE RISK: Rule violations detected (Rule Score: 60) | Combined Score: 60 (NLP: 0, Rules: 60)',60,'ESCALATED',5,NULL,NULL),(3,'2025-10-29 07:04:12.272172','MODERATE RISK: Rule violations detected (Rule Score: 88) | Combined Score: 88 (NLP: 0, Rules: 88)',88,'OPEN',6,NULL,NULL),(4,'2025-10-29 07:54:09.685201','MODERATE INTERCURRENCY: Rule violations (Rule: 88) | Score: 88 (NLP: 10, Rules: 88) | Conversion: 25000 INR → 293.40 USD',88,'OPEN',7,NULL,NULL),(5,'2025-10-30 08:20:14.743825','CRITICAL INTERCURRENCY: Both suspicious keywords and rule violations | Score: 100 (NLP: 100, Rules: 100) | Conversion: 40000 INR → 469.80 USD',100,'OPEN',9,NULL,NULL),(6,'2025-10-30 08:34:06.072654','MODERATE INTERCURRENCY: Rule violations (Rule: 88) | Score: 88 (NLP: 0, Rules: 88) | Conversion: 1600000 INR → 19176.00 USD',88,'RESOLVED',12,'2025-10-30 08:45:10.332042','Rishit_rarthod'),(7,'2025-10-30 08:43:45.417826','MODERATE RISK: Rule violations detected (Rule Score: 70) | Combined Score: 70 (NLP: 5, Rules: 70)',70,'RESOLVED',13,'2025-10-30 08:45:05.649265','Rishit_rarthod'),(8,'2025-10-30 08:49:22.793739','CRITICAL: Severe rule violations detected (Rule Score: 91) | Combined Score: 91 (NLP: 0, Rules: 91)',91,'RESOLVED',14,'2025-10-30 08:50:38.448676','Rishit_rarthod'),(9,'2025-10-30 11:15:04.202227','MODERATE RISK: Rule violations detected (Rule Score: 60) | Combined Score: 60 (NLP: 0, Rules: 60)',60,'OPEN',15,NULL,NULL),(10,'2025-10-30 11:24:50.696986','MODERATE RISK: Rule violations detected (Rule Score: 60) | Combined Score: 60 (NLP: 0, Rules: 60)',60,'OPEN',16,NULL,NULL),(11,'2025-10-30 11:28:27.493076','MODERATE RISK: Rule violations detected (Rule Score: 60) | Combined Score: 60 (NLP: 0, Rules: 60)',60,'ESCALATED',17,NULL,NULL),(12,'2025-10-30 13:04:10.521679','MODERATE RISK: Rule violations detected (Rule Score: 60) | Combined Score: 60 (NLP: 5, Rules: 60)',60,'OPEN',18,NULL,NULL),(13,'2025-10-31 04:29:05.466234','CRITICAL: Both suspicious keywords and rule violations detected | Combined Score: 100 (NLP: 100, Rules: 100)',100,'OPEN',19,NULL,NULL),(14,'2025-10-31 05:40:40.591042','CRITICAL: Severe rule violations detected (Rule Score: 91) | Combined Score: 91 (NLP: 5, Rules: 91)',91,'OPEN',20,NULL,NULL),(15,'2025-10-31 07:50:06.047668','MODERATE RISK: Rule violations detected (Rule Score: 70) | Combined Score: 70 (NLP: 0, Rules: 70)',70,'OPEN',21,NULL,NULL),(16,'2025-10-31 07:53:23.952735','MODERATE RISK: Rule violations detected (Rule Score: 60) | Combined Score: 60 (NLP: 5, Rules: 60)',60,'OPEN',22,NULL,NULL),(17,'2025-10-31 08:11:00.043478','MODERATE RISK: Rule violations detected (Rule Score: 60) | Combined Score: 60 (NLP: 0, Rules: 60)',60,'OPEN',28,NULL,NULL),(18,'2025-10-31 09:39:50.879093','MODERATE RISK: Rule violations detected (Rule Score: 60) | Combined Score: 60 (NLP: 0, Rules: 60)',60,'ESCALATED',29,NULL,NULL),(19,'2025-11-04 10:43:57.348510','CRITICAL: Severe rule violations detected (Rule Score: 99) | Combined Score: 99 (NLP: 5, Rules: 99)',99,'OPEN',32,NULL,NULL),(20,'2025-11-04 10:46:16.684727','CRITICAL: Severe rule violations detected (Rule Score: 98) | Combined Score: 98 (NLP: 5, Rules: 98)',98,'OPEN',33,NULL,NULL);
/*!40000 ALTER TABLE `alert` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-04 11:01:23
