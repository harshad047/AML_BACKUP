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
-- Table structure for table `suspicious_keywords`
--

DROP TABLE IF EXISTS `suspicious_keywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suspicious_keywords` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `keyword` varchar(255) NOT NULL,
  `risk_level` varchar(20) NOT NULL,
  `risk_score` int NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `case_sensitive` tinyint(1) NOT NULL DEFAULT '0',
  `whole_word_only` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `keyword` (`keyword`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suspicious_keywords`
--

LOCK TABLES `suspicious_keywords` WRITE;
/*!40000 ALTER TABLE `suspicious_keywords` DISABLE KEYS */;
INSERT INTO `suspicious_keywords` VALUES (1,'money laundering','CRITICAL',100,'FINANCIAL_CRIME','Direct reference to money laundering activity',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(2,'terrorist','CRITICAL',100,'TERRORISM','Terrorism-related activity',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(3,'terrorism','CRITICAL',100,'TERRORISM','Terrorism-related activity',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(4,'drug trafficking','CRITICAL',95,'DRUG_RELATED','Drug trafficking activity',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(5,'narcotics','CRITICAL',95,'DRUG_RELATED','Illegal drug trade',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(6,'weapons','CRITICAL',95,'WEAPONS','Weapons trafficking',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(7,'arms dealing','CRITICAL',95,'WEAPONS','Arms trafficking',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(8,'fraud','CRITICAL',90,'FINANCIAL_CRIME','Fraudulent activity',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(9,'scam','CRITICAL',90,'FINANCIAL_CRIME','Scam activity',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(10,'blackmail','CRITICAL',90,'EXTORTION','Blackmail activity',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(11,'ransom','CRITICAL',90,'EXTORTION','Ransom payment',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(12,'bribe','CRITICAL',85,'CORRUPTION','Bribery activity',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(13,'corruption','CRITICAL',85,'CORRUPTION','Corrupt practices',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(14,'human trafficking','CRITICAL',100,'HUMAN_TRAFFICKING','Human trafficking activity',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(15,'child exploitation','CRITICAL',100,'EXPLOITATION','Child exploitation',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(16,'shell company','HIGH',75,'SHELL_ENTITIES','Shell company structure',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(17,'offshore','HIGH',70,'OFFSHORE','Offshore financial activity',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(18,'bitcoin','HIGH',65,'CRYPTOCURRENCY','Bitcoin transactions',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(19,'cryptocurrency','HIGH',65,'CRYPTOCURRENCY','Cryptocurrency transactions',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(20,'crypto','HIGH',60,'CRYPTOCURRENCY','Crypto transactions',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(21,'anonymous','HIGH',65,'ANONYMITY','Anonymous transactions',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(22,'untraceable','HIGH',70,'ANONYMITY','Untraceable payments',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(23,'cash pickup','HIGH',60,'CASH_SERVICES','Cash pickup services',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(24,'hawala','HIGH',75,'ALTERNATIVE_REMITTANCE','Hawala money transfer',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(25,'smurfing','HIGH',70,'STRUCTURING','Smurfing technique',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(26,'structuring','HIGH',70,'STRUCTURING','Transaction structuring',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(27,'layering','HIGH',65,'MONEY_LAUNDERING','Layering technique',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(28,'placement','HIGH',65,'MONEY_LAUNDERING','Placement technique',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(29,'integration','HIGH',60,'MONEY_LAUNDERING','Integration technique',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(30,'bearer bonds','HIGH',70,'BEARER_INSTRUMENTS','Bearer bond instruments',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(31,'urgent','MEDIUM',45,'URGENCY','Urgent transaction request',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(32,'immediate','MEDIUM',45,'URGENCY','Immediate transaction request',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(33,'confidential','MEDIUM',40,'SECRECY','Confidential transaction',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(34,'private','MEDIUM',35,'SECRECY','Private transaction',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(35,'secret','MEDIUM',45,'SECRECY','Secret transaction',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(36,'discreet','MEDIUM',40,'SECRECY','Discreet transaction',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(37,'under the table','MEDIUM',50,'INFORMAL','Under the table payment',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(38,'no questions','MEDIUM',50,'INFORMAL','No questions asked',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(39,'cash only','MEDIUM',45,'CASH_PREFERENCE','Cash only transactions',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(40,'bearer','MEDIUM',40,'BEARER_INSTRUMENTS','Bearer instruments',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(41,'bulk cash','MEDIUM',40,'BULK_CASH','Bulk cash transactions',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(42,'round amount','MEDIUM',30,'PATTERNS','Round amount transactions',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(43,'exact amount','MEDIUM',25,'PATTERNS','Exact amount patterns',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(44,'multiple transactions','MEDIUM',35,'PATTERNS','Multiple transaction pattern',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(45,'split payment','MEDIUM',40,'STRUCTURING','Split payment structure',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(46,'large','LOW',20,'SIZE_INDICATORS','Large transaction indicator',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(47,'business','LOW',15,'BUSINESS','Business transaction',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(48,'investment','LOW',20,'INVESTMENT','Investment transaction',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(49,'payment','LOW',10,'GENERAL','General payment',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(50,'transfer','LOW',10,'GENERAL','General transfer',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(51,'loan','LOW',15,'LENDING','Loan transaction',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(52,'gift','LOW',10,'PERSONAL','Gift transaction',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(53,'family','LOW',5,'PERSONAL','Family transaction',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(54,'salary','LOW',5,'EMPLOYMENT','Salary payment',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL),(55,'bonus','LOW',10,'EMPLOYMENT','Bonus payment',1,0,1,'SYSTEM',NULL,'2025-10-04 11:06:48.000000',NULL);
/*!40000 ALTER TABLE `suspicious_keywords` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-06 14:11:55
