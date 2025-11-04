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
-- Table structure for table `helpdesk_ticket`
--

DROP TABLE IF EXISTS `helpdesk_ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `helpdesk_ticket` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `message` text NOT NULL,
  `officer_response` text,
  `responded_at` datetime(6) DEFAULT NULL,
  `status` enum('CLOSED','OPEN','RESOLVED','RESPONDED') NOT NULL,
  `subject` varchar(200) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `assigned_officer_id` bigint DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  `responded_by_officer_id` bigint DEFAULT NULL,
  `transaction_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKlkm8uielfs1fmquo8ib7y703y` (`assigned_officer_id`),
  KEY `FKm2p16bvex37wq9d2ame1oug4t` (`customer_id`),
  KEY `FKi8kwjw1lllhkoj07wm14j18me` (`responded_by_officer_id`),
  KEY `FKhs5wqpsvmu0dig9ggmehsqpdk` (`transaction_id`),
  CONSTRAINT `FKhs5wqpsvmu0dig9ggmehsqpdk` FOREIGN KEY (`transaction_id`) REFERENCES `transaction` (`id`),
  CONSTRAINT `FKi8kwjw1lllhkoj07wm14j18me` FOREIGN KEY (`responded_by_officer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKlkm8uielfs1fmquo8ib7y703y` FOREIGN KEY (`assigned_officer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKm2p16bvex37wq9d2ame1oug4t` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `helpdesk_ticket`
--

LOCK TABLES `helpdesk_ticket` WRITE;
/*!40000 ALTER TABLE `helpdesk_ticket` DISABLE KEYS */;
INSERT INTO `helpdesk_ticket` VALUES (1,'2025-10-30 13:06:42.202054','salary',NULL,NULL,'RESOLVED','Issue with transaction #18','2025-10-31 03:34:34.051906',6,1,NULL,18),(2,'2025-10-31 03:33:21.246117','issue',NULL,NULL,'RESOLVED','Issue with transaction #18','2025-10-31 03:34:10.776634',6,1,NULL,18),(3,'2025-10-31 03:52:16.453288','abcd',NULL,NULL,'RESPONDED','Issue with transaction #5','2025-10-31 03:53:41.579504',6,1,NULL,5),(4,'2025-10-31 04:15:31.646196','abcd',NULL,NULL,'OPEN','Issue with Transaction #18','2025-10-31 04:15:31.646196',6,1,NULL,18),(5,'2025-10-31 04:29:15.580099','abcd',NULL,NULL,'RESOLVED','Issue with Transaction #19','2025-10-31 07:36:59.881975',6,3,NULL,19),(6,'2025-10-31 05:44:09.926235','i want to know why my transaction got blocked',NULL,NULL,'RESOLVED','Issue with Transaction #20','2025-10-31 07:37:43.640921',6,7,NULL,20),(7,'2025-10-31 09:37:53.618277','I want To know About How It is blocked',NULL,NULL,'RESOLVED','Issue with Transaction #22','2025-11-03 06:42:43.401433',6,7,NULL,22);
/*!40000 ALTER TABLE `helpdesk_ticket` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-04 11:01:24
