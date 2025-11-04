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
-- Table structure for table `rule_condition`
--

DROP TABLE IF EXISTS `rule_condition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule_condition` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `field` varchar(255) DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `operator` varchar(255) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  `rule_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8x1wy56d4k53dbfa69513wyjg` (`rule_id`),
  CONSTRAINT `FK8x1wy56d4k53dbfa69513wyjg` FOREIGN KEY (`rule_id`) REFERENCES `rule` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rule_condition`
--

LOCK TABLES `rule_condition` WRITE;
/*!40000 ALTER TABLE `rule_condition` DISABLE KEYS */;
INSERT INTO `rule_condition` VALUES (1,'countryCode',_binary '','>=','COUNTRY_RISK','80',1),(2,'amount',_binary '','>','AMOUNT','1000',1),(3,'nlpScore',_binary '','>=','NLP_SCORE','80',2),(4,'text',_binary '','CONTAINS','KEYWORD_MATCH','urgent transfer',3),(5,'amount',_binary '','>','AMOUNT','5000',3),(6,'text',_binary '','CONTAINS','KEYWORD_MATCH','offshore account',4),(7,'text',_binary '','CONTAINS','KEYWORD_MATCH','cash pickup',5),(8,'amount',_binary '','<','AMOUNT','10000',5),(9,'nlpScore',_binary '','>=','NLP_SCORE','90',6),(10,'count',_binary '','>','PAST_TRANSACTIONS','30',7),(11,'sum',_binary '','>','PAST_TRANSACTIONS','1000000',7),(13,'count',_binary '','>=','VELOCITY','100000|5|24|ANY',9),(14,'sum',_binary '','>=','STRUCTURING','50000|300000|24|DEPOSIT,TRANSFER',10),(15,'amount_percentile',_binary '','>=','BEHAVIORAL_DEVIATION','90|95',11),(16,'ratio',_binary '','>=','AMOUNT_BALANCE_RATIO','0.8',12),(17,'sum',_binary '','>=','DAILY_TOTAL','400000|24|DEPOSIT,TRANSFER',13),(18,'is_new',_binary '','==','NEW_COUNTERPARTY','0|50000|ANY',14),(20,'transaction_pattern',_binary '','PATTERN','PATTERN_DEPOSIT_WITHDRAW','3|1.0',15);
/*!40000 ALTER TABLE `rule_condition` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-04 11:01:26
