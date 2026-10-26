-- MySQL dump 10.13  Distrib 8.4.13, for macos26.6 (arm64)
--
-- Host: 127.0.0.1    Database: expense_tracker
-- ------------------------------------------------------
-- Server version	8.4.13

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Salary','income'),(2,'Food','expense'),(3,'Transport','expense'),(4,'Shopping','expense'),(5,'House Rent','expense'),(6,'Medical','expense'),(7,'Other Income','income');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `monthly_budgets`
--

DROP TABLE IF EXISTS `monthly_budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monthly_budgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `budget_month` char(7) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `budget_month` (`budget_month`),
  CONSTRAINT `chk_budget_amount` CHECK ((`amount` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `monthly_budgets`
--

LOCK TABLES `monthly_budgets` WRITE;
/*!40000 ALTER TABLE `monthly_budgets` DISABLE KEYS */;
INSERT INTO `monthly_budgets` VALUES (1,'2026-10',60000.00,'2026-10-26 05:53:35','2026-10-26 05:54:37');
/*!40000 ALTER TABLE `monthly_budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_transaction_category` (`category_id`),
  CONSTRAINT `fk_transaction_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `transactions_chk_1` CHECK ((`amount` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (3,3,'expense',5000.00,NULL,'2026-10-25','2026-10-25 07:34:35'),(4,1,'income',65000.00,'October Salary','2026-10-25','2026-10-25 08:46:42'),(5,1,'income',50000.00,NULL,'2026-09-01','2026-10-25 08:48:29'),(6,5,'expense',20000.00,NULL,'2026-09-01','2026-10-25 08:49:06'),(7,5,'expense',20000.00,NULL,'2026-10-26','2026-10-26 05:54:55');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'expense_tracker'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-26 12:02:55
