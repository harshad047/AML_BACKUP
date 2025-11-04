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
-- Table structure for table `customer_documents`
--

DROP TABLE IF EXISTS `customer_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `doc_type` varchar(255) NOT NULL,
  `status` enum('REJECTED','UPLOADED','VERIFIED') NOT NULL,
  `storage_path` varchar(1000) NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `customer_id` bigint NOT NULL,
  `rejection_reason` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKp8yxbfjsubcrp9pur4ejb9gtv` (`customer_id`),
  CONSTRAINT `FKp8yxbfjsubcrp9pur4ejb9gtv` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_documents`
--

LOCK TABLES `customer_documents` WRITE;
/*!40000 ALTER TABLE `customer_documents` DISABLE KEYS */;
INSERT INTO `customer_documents` VALUES (1,'PAN','VERIFIED','https://res.cloudinary.com/dxelpi5xd/image/upload/v1761712890/kyc_docs/customer_1/bti2aqiugegtjhvhhsef.jpg','2025-10-29 04:41:49.755095',1,NULL),(2,'AADHAAR','VERIFIED','https://res.cloudinary.com/dxelpi5xd/image/upload/v1761713365/kyc_docs/customer_1/daohdjruz5faogxpe3ml.jpg','2025-10-29 04:49:44.678317',1,NULL),(3,'AADHAAR','VERIFIED','https://res.cloudinary.com/dxelpi5xd/image/upload/v1761713745/kyc_docs/customer_2/pi4oawjipsvhljqayp10.jpg','2025-10-29 04:56:04.270489',2,NULL),(4,'AADHAAR','VERIFIED','https://res.cloudinary.com/dxelpi5xd/image/upload/v1761888998/kyc_docs/customer_3/cgkqbjhrtcwyatqh0gvf.png','2025-10-31 05:36:38.618372',3,NULL);
/*!40000 ALTER TABLE `customer_documents` ENABLE KEYS */;
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
