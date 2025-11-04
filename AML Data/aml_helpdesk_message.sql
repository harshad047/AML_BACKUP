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
-- Table structure for table `helpdesk_message`
--

DROP TABLE IF EXISTS `helpdesk_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `helpdesk_message` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `sender_type` enum('CUSTOMER','OFFICER') NOT NULL,
  `author_id` bigint NOT NULL,
  `ticket_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKl808n4kyyecmnu8rgf6bulpnj` (`author_id`),
  KEY `FKjbmhuicuwxbtghofvj0ody6mj` (`ticket_id`),
  CONSTRAINT `FKjbmhuicuwxbtghofvj0ody6mj` FOREIGN KEY (`ticket_id`) REFERENCES `helpdesk_ticket` (`id`),
  CONSTRAINT `FKl808n4kyyecmnu8rgf6bulpnj` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `helpdesk_message`
--

LOCK TABLES `helpdesk_message` WRITE;
/*!40000 ALTER TABLE `helpdesk_message` DISABLE KEYS */;
INSERT INTO `helpdesk_message` VALUES (1,'salary','2025-10-30 13:06:42.278649','CUSTOMER',1,1),(2,'issue','2025-10-31 03:33:21.265866','CUSTOMER',1,2),(3,'abcd','2025-10-31 03:52:16.497244','CUSTOMER',1,3),(4,'done issue resolved','2025-10-31 03:53:41.574107','OFFICER',6,3),(5,'abcd','2025-10-31 04:15:31.656711','CUSTOMER',1,4),(6,'hey','2025-10-31 04:15:49.334308','CUSTOMER',1,4),(7,'abcd','2025-10-31 04:29:15.586778','CUSTOMER',3,5),(8,'i want to know why my transaction got blocked','2025-10-31 05:44:09.935214','CUSTOMER',7,6),(9,'it was found suspicious','2025-10-31 07:37:35.280567','OFFICER',6,6),(10,'I want To know About How It is blocked','2025-10-31 09:37:53.646587','CUSTOMER',7,7),(11,'You have broke some rules','2025-10-31 09:44:26.542904','OFFICER',6,7),(12,'why','2025-11-01 12:08:29.831400','OFFICER',6,7);
/*!40000 ALTER TABLE `helpdesk_message` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-04 11:01:21
