-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 43.203.127.141    Database: uptention
-- ------------------------------------------------------
-- Server version	8.0.36

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
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `employee_number` varchar(31) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(31) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `point` int DEFAULT NULL,
  `profile_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('ROLE_ADMIN','ROLE_MEMBER','ROLE_TEMP_MEMBER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` bit(1) DEFAULT NULL,
  `username` varchar(31) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wallet` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8qyjuwx3wckyjst0w42gftnie` (`company_id`),
  CONSTRAINT `FK8qyjuwx3wckyjst0w42gftnie` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'2025-03-01 10:38:41.000000','2025-03-01 10:38:41.000000','0','관리자','$2a$12$cIBhnKMu/ZMdckxXr0W41uyhalqv2/RHVSMtwgKvthkyUKfCMXQAC',0,NULL,'ROLE_ADMIN',_binary '','admin1234',NULL,4),(2,'2025-03-01 10:39:41.000000','2025-03-01 10:39:41.000000','0','관리자2','$2a$12$cIBhnKMu/ZMdckxXr0W41uyhalqv2/RHVSMtwgKvthkyUKfCMXQAC',0,NULL,'ROLE_ADMIN',_binary '','admin2345',NULL,4),(3,'2025-03-01 10:40:41.000000','2025-03-01 10:40:41.000000','0','관리자3','$2a$12$cIBhnKMu/ZMdckxXr0W41uyhalqv2/RHVSMtwgKvthkyUKfCMXQAC',0,NULL,'ROLE_ADMIN',_binary '','admin3456',NULL,4),(4,'2025-03-02 10:40:41.000000','2025-03-02 10:40:41.000000','1221234','최인국','$2a$10$tG.52pTwE7flD3Q/TCZZ..CWgnGfhktKSEUVhVaVR/XxFEBz8H78W',1,'profile-default.jpg','ROLE_MEMBER',_binary '','user1234','9ntpscYwdm1yMkQno6iD89qgcMtjFTWky3mEVwjtVBKG',4),(5,'2025-03-03 10:40:41.000000','2025-03-03 10:40:41.000000','1222345','백성욱','$2a$10$6lX4XeDTeBA.uezbhEjHROphPi0Vqe2PLCUQnzRjR9xa/5sY1p2Be',3,'209ca180-e701-4d93-82a9-9b87d70d26ae.jpg','ROLE_MEMBER',_binary '','user2345','ExQ99mf5oxvGgEtvPgeMzxuooTfmhTaPpaNiM2AaEHDq',4),(6,'2025-03-04 10:40:41.000000','2025-03-04 10:40:41.000000','1223456','박효진','$2a$10$qJT9XH.msh/wIvxvQzczqeSSuODDAiBHp5WAiRLr4cYvvvAjYLtla',2,'aeed9572-c4ab-4ac1-bec0-e1a03595b91c.jpg','ROLE_MEMBER',_binary '','user3456','FEtuaV1BUHvaHVyu93i9CKXDhakFMK56gy1c7ZQNZphy',4),(7,'2025-03-05 10:40:41.000000','2025-03-05 10:40:41.000000','1229555','박준수','$2a$10$KqbDjcUCVzsygcZYB5lRMuP.tJxqZ8ZnrV8IAfVNrPnJgu4qGzNFC',0,'profile-default.jpg','ROLE_MEMBER',_binary '','user1999','CrUUoVztP8Avu6v9JJsp5qGsG848ppVcApxv1sWv8gRK',4),(8,'2025-03-06 10:40:41.000000','2025-03-06 10:40:41.000000','1226611','오승우','$2a$10$LA/pPsLCOnBaN0FUumWuSOE.jah0VVh05/MEP60LSMKCsEiYGFAVS',0,'c25683bc-99e4-44a3-9dec-6d01c280f9cf.jpg','ROLE_MEMBER',_binary '','user9921','9ntpscYwdm1yMkQno6iD89qgcMtjFTWky3mEVwjtVBKG',4),(9,'2025-03-07 10:40:41.000000','2025-03-07 10:40:41.000000','1223114','안수진','$2a$10$IbyWtkv8XCGLVxtGcgmg2uN1AoOiVO3vyphaEYTGl/smLhG0hA23y',0,'profile-default.jpg','ROLE_MEMBER',_binary '','ssuzynii','9ntpscYwdm1yMkQno6iD89qgcMtjFTWky3mEVwjtVBKG',4),(10,'2025-03-08 10:40:41.000000','2025-03-08 10:40:41.000000','1229681','류재문','$2a$10$If9wlp.58/39rBpFsgKlFuHg5Yl1GQEy3YXjKP5HcGH/TPA5u8j/C',0,'profile-default.jpg','ROLE_TEMP_MEMBER',_binary '','woans5907',NULL,4),(11,'2025-03-09 10:40:41.000000','2025-03-09 10:40:41.000000','asd01234','조대성','$2a$10$LYAoWel8LlsMD3uqrhLJGueV/lblBUkvQ.YMfV12MoElhgBV6.ecm',0,'profile-default.jpg','ROLE_TEMP_MEMBER',_binary '\0','asd01234',NULL,4),(12,'2025-03-10 10:40:41.000000','2025-03-10 10:40:41.000000','1226781','신해인','$2a$10$XPC9hvOD1.x2ddDScXFP9.BN.1HgUuNjxHxCQhQVJjAuBGrDxCGm.',0,'profile-default.jpg','ROLE_TEMP_MEMBER',_binary '\0','stitchzzang',NULL,4),(13,'2025-03-11 10:40:41.000000','2025-03-11 10:40:41.000000','1','박효진','$2a$10$jdMq0hxkBBmeVkj2.OuOQuGSxT1fYoHIT2HjdqCaXC7UBsgJucGZu',0,'profile-default.jpg','ROLE_TEMP_MEMBER',_binary '\0','123123123123123',NULL,4);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-09 14:36:17
