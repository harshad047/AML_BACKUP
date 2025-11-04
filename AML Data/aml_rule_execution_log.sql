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
-- Table structure for table `rule_execution_log`
--

DROP TABLE IF EXISTS `rule_execution_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule_execution_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `details` varchar(255) DEFAULT NULL,
  `evaluated_at` datetime(6) DEFAULT NULL,
  `matched` bit(1) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `rule_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKcab008phslatlemm7ie903a49` (`rule_id`),
  CONSTRAINT `FKcab008phslatlemm7ie903a49` FOREIGN KEY (`rule_id`) REFERENCES `rule` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rule_execution_log`
--

LOCK TABLES `rule_execution_log` WRITE;
/*!40000 ALTER TABLE `rule_execution_log` DISABLE KEYS */;
INSERT INTO `rule_execution_log` VALUES (1,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-29 07:04:03.218366',_binary '','4',15),(2,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-29 07:04:08.352000',_binary '','5',15),(3,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-29 07:04:12.237633',_binary '','6',15),(4,'Rule triggered: Behavioral Deviation High Amount | action=FLAG | weight=70 | priority=3 | conditions=BEHAVIORAL_DEVIATION >= 90|95 => true','2025-10-29 07:04:12.268216',_binary '','6',11),(5,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-29 07:54:09.609192',_binary '','7',15),(6,'Rule triggered: Behavioral Deviation High Amount | action=FLAG | weight=70 | priority=3 | conditions=BEHAVIORAL_DEVIATION >= 90|95 => true','2025-10-29 07:54:09.677888',_binary '','7',11),(7,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-30 08:20:14.723061',_binary '','9',15),(8,'Rule triggered: High NLP Risk Score | action=BLOCK | weight=90 | priority=2 | conditions=NLP_SCORE >= 80 => true','2025-10-30 08:20:14.735780',_binary '','9',2),(9,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-30 08:34:05.992689',_binary '','12',15),(10,'Rule triggered: Behavioral Deviation High Amount | action=FLAG | weight=70 | priority=3 | conditions=BEHAVIORAL_DEVIATION >= 90|95 => true','2025-10-30 08:34:06.067133',_binary '','12',11),(11,'Rule triggered: High Balance Impact Ratio | action=FLAG | weight=70 | priority=2 | conditions=AMOUNT_BALANCE_RATIO >= 0.8 => true','2025-10-30 08:43:45.370315',_binary '','13',12),(12,'Rule triggered: High Balance Impact Ratio | action=FLAG | weight=70 | priority=2 | conditions=AMOUNT_BALANCE_RATIO >= 0.8 => true','2025-10-30 08:49:22.756949',_binary '','14',12),(13,'Rule triggered: Behavioral Deviation High Amount | action=FLAG | weight=70 | priority=3 | conditions=BEHAVIORAL_DEVIATION >= 90|95 => true','2025-10-30 08:49:22.787958',_binary '','14',11),(15,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-30 11:24:50.624156',_binary '','16',15),(16,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-30 11:28:27.448269',_binary '','17',15),(17,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-30 13:04:10.432208',_binary '','18',15),(18,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-31 04:29:05.445710',_binary '','19',15),(19,'Rule triggered: High NLP Risk Score | action=BLOCK | weight=90 | priority=2 | conditions=NLP_SCORE >= 80 => true','2025-10-31 04:29:05.456650',_binary '','19',2),(20,'Rule triggered: High Balance Impact Ratio | action=FLAG | weight=70 | priority=2 | conditions=AMOUNT_BALANCE_RATIO >= 0.8 => true','2025-10-31 05:40:40.501398',_binary '','20',12),(21,'Rule triggered: New Counterparty High Amount | action=FLAG | weight=70 | priority=2 | conditions=NEW_COUNTERPARTY == 0|50000|ANY => true','2025-10-31 05:40:40.561081',_binary '','20',14),(22,'Rule triggered: High Balance Impact Ratio | action=FLAG | weight=70 | priority=2 | conditions=AMOUNT_BALANCE_RATIO >= 0.8 => true','2025-10-31 07:50:05.981825',_binary '','21',12),(23,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-31 07:53:23.904663',_binary '','22',15),(24,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-31 08:11:00.004883',_binary '','28',15),(25,'Rule triggered: Pattern In Deposit And Withdraw | action=FLAG | weight=60 | priority=1 | conditions=PATTERN_DEPOSIT_WITHDRAW PATTERN 3|1.0 => true','2025-10-31 09:39:50.737666',_binary '','29',15),(26,'Rule triggered: High Value Deposit Velocity | action=FLAG | weight=80 | priority=1 | conditions=','2025-11-04 10:43:57.134818',_binary '','32',8),(27,'Rule triggered: High Balance Impact Ratio | action=FLAG | weight=70 | priority=2 | conditions=AMOUNT_BALANCE_RATIO >= 0.8 => true','2025-11-04 10:43:57.214885',_binary '','32',12),(28,'Rule triggered: New Counterparty High Amount | action=FLAG | weight=70 | priority=2 | conditions=NEW_COUNTERPARTY == 0|50000|ANY => true','2025-11-04 10:43:57.252481',_binary '','32',14),(29,'Rule triggered: Behavioral Deviation High Amount | action=FLAG | weight=70 | priority=3 | conditions=BEHAVIORAL_DEVIATION >= 90|95 => true','2025-11-04 10:43:57.283466',_binary '','32',11),(30,'Rule triggered: High Value Deposit Velocity | action=FLAG | weight=80 | priority=1 | conditions=','2025-11-04 10:46:16.582470',_binary '','33',8),(31,'Rule triggered: New Counterparty High Amount | action=FLAG | weight=70 | priority=2 | conditions=NEW_COUNTERPARTY == 0|50000|ANY => true','2025-11-04 10:46:16.642683',_binary '','33',14),(32,'Rule triggered: Behavioral Deviation High Amount | action=FLAG | weight=70 | priority=3 | conditions=BEHAVIORAL_DEVIATION >= 90|95 => true','2025-11-04 10:46:16.656092',_binary '','33',11);
/*!40000 ALTER TABLE `rule_execution_log` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-04 11:01:25
