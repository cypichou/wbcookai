-- MySQL dump 10.13  Distrib 9.2.0, for Linux (x86_64)
--
-- Host: localhost    Database: cook
-- ------------------------------------------------------
-- Server version	9.2.0

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
-- Current Database: `cook`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `cook` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `cook`;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) DEFAULT NULL,
  `unite` varchar(10) DEFAULT NULL,
  `rayon` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Viande','g','Protéines'),(3,'Poisson','g','Protéines'),(4,'Légume','g','Fruits et légumes'),(5,'Fruit','pièce','Fruits et légumes'),(6,'Oléagineux','g','Lipides'),(7,'Féculent','g','Féculents'),(8,'Produit laitier','ml','Produits laitiers'),(9,'Epices','c. à soupe','Condiments'),(10,'Condiments','c. à soupe','Condiments'),(14,NULL,'pièce','Protéines'),(15,NULL,'pièce','Féculents'),(16,NULL,'g','Produits laitiers'),(17,NULL,'ml','Lipides'),(18,NULL,'c. à soupe','Lipides'),(19,NULL,'g','Épicerie'),(20,NULL,'ml','Épicerie'),(21,NULL,'pièce','Épicerie'),(22,NULL,'c. à café','Condiments'),(23,NULL,'pincée','Condiments');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredients`
--

DROP TABLE IF EXISTS `ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) DEFAULT NULL,
  `glucides` int DEFAULT NULL,
  `lipides` int DEFAULT NULL,
  `calories` int DEFAULT NULL,
  `id_saison` int DEFAULT NULL,
  `id_categorie` int DEFAULT NULL,
  `proteines` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_saison` (`id_saison`),
  KEY `id_categorie` (`id_categorie`),
  CONSTRAINT `ingredients_ibfk_1` FOREIGN KEY (`id_saison`) REFERENCES `saisons` (`id`),
  CONSTRAINT `ingredients_ibfk_2` FOREIGN KEY (`id_categorie`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredients`
--

LOCK TABLES `ingredients` WRITE;
/*!40000 ALTER TABLE `ingredients` DISABLE KEYS */;
INSERT INTO `ingredients` VALUES (1,'Tomate',4,0,18,1,5,1),(2,'pesto',NULL,NULL,NULL,1,5,NULL),(3,'carotte',10,1,17,1,4,2),(4,'Taglitele',10,0,20,1,7,10),(5,'Poulet',0,2,30,1,1,22),(6,'Sardines',0,10,8,1,3,23),(7,'Pommes',10,2,30,1,5,3),(8,'Amandes',3,3,3,1,6,6),(9,'Beurre',4,4,34,1,8,5),(10,'Poivres',0,0,0,1,9,0),(16,'Haricot',NULL,NULL,NULL,NULL,7,NULL),(17,'Riz',NULL,NULL,NULL,NULL,7,NULL),(18,'Ratatouille conserve',NULL,NULL,NULL,NULL,4,NULL);
/*!40000 ALTER TABLE `ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outils`
--

DROP TABLE IF EXISTS `outils`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outils` (
  `id_outil` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id_outil`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outils`
--

LOCK TABLES `outils` WRITE;
/*!40000 ALTER TABLE `outils` DISABLE KEYS */;
INSERT INTO `outils` VALUES (1,'Four'),(2,'Micro-onde'),(3,'Casserole'),(4,'Râpe'),(5,'Ecrase purée'),(6,'Batteur'),(7,'Moule'),(8,'Cocotte minute');
/*!40000 ALTER TABLE `outils` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recette_outils`
--

DROP TABLE IF EXISTS `recette_outils`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recette_outils` (
  `id_outil` int NOT NULL,
  `id_recette` int NOT NULL,
  PRIMARY KEY (`id_outil`,`id_recette`),
  KEY `recette_outils_ibfk_2` (`id_recette`),
  CONSTRAINT `recette_outils_ibfk_1` FOREIGN KEY (`id_outil`) REFERENCES `outils` (`id_outil`),
  CONSTRAINT `recette_outils_ibfk_2` FOREIGN KEY (`id_recette`) REFERENCES `recettes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recette_outils`
--

LOCK TABLES `recette_outils` WRITE;
/*!40000 ALTER TABLE `recette_outils` DISABLE KEYS */;
INSERT INTO `recette_outils` VALUES (1,1),(2,1),(1,9),(3,13);
/*!40000 ALTER TABLE `recette_outils` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recettes`
--

DROP TABLE IF EXISTS `recettes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recettes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `temps_de_preparation` int DEFAULT NULL,
  `consignes` text,
  `image_url` varchar(255) DEFAULT NULL,
  `prix` float DEFAULT NULL,
  `id_saison` int DEFAULT NULL,
  `vegetarien` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `recettes_ibfk_saison` (`id_saison`),
  CONSTRAINT `recettes_ibfk_saison` FOREIGN KEY (`id_saison`) REFERENCES `saisons` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recettes`
--

LOCK TABLES `recettes` WRITE;
/*!40000 ALTER TABLE `recettes` DISABLE KEYS */;
INSERT INTO `recettes` VALUES (1,'Pâtes à la carbonara',20,'Faire cuire les pâtes. Pendant ce temps, préparer la sauce avec des œufs, du fromage et des lardons.','img.png',4.5,2,NULL),(4,'Pates pesto',20,'blableublibloblou','img.png',3,7,NULL),(5,'Pates fraiches sardines',5,'Oleeee','img.png',4,7,NULL),(6,'Smoothie de la force',45,'Mais c\'est chaud','img.png',2.5,1,NULL),(9,'Tarte flambée',30,'Je suis un paragraphe de consigne','/receipesImage/img.png',6,2,NULL),(13,'Chili vege',30,NULL,NULL,2,7,1);
/*!40000 ALTER TABLE `recettes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recettes_ingredients`
--

DROP TABLE IF EXISTS `recettes_ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recettes_ingredients` (
  `id_recette` int NOT NULL,
  `id_ingredient` int NOT NULL,
  `quantite` float DEFAULT NULL,
  PRIMARY KEY (`id_recette`,`id_ingredient`),
  KEY `recette_id` (`id_recette`),
  KEY `recettes_ingredients_ibfk_1` (`id_ingredient`),
  CONSTRAINT `recettes_ingredients_ibfk_1` FOREIGN KEY (`id_ingredient`) REFERENCES `ingredients` (`id`),
  CONSTRAINT `recettes_ingredients_ibfk_2` FOREIGN KEY (`id_recette`) REFERENCES `recettes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recettes_ingredients`
--

LOCK TABLES `recettes_ingredients` WRITE;
/*!40000 ALTER TABLE `recettes_ingredients` DISABLE KEYS */;
INSERT INTO `recettes_ingredients` VALUES (1,1,1),(1,4,7),(4,1,2),(4,2,3),(4,3,2),(4,5,1),(4,6,3),(6,7,1),(6,8,5),(9,1,2),(9,2,3),(13,16,50),(13,17,100),(13,18,100);
/*!40000 ALTER TABLE `recettes_ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recettes_semaine`
--

DROP TABLE IF EXISTS `recettes_semaine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recettes_semaine` (
  `id_semaine` int NOT NULL AUTO_INCREMENT,
  `jour` varchar(20) DEFAULT NULL,
  `moment` varchar(20) DEFAULT NULL,
  `id_recette` int DEFAULT NULL,
  PRIMARY KEY (`id_semaine`),
  KEY `id_recette` (`id_recette`),
  CONSTRAINT `recettes_semaine_ibfk_1` FOREIGN KEY (`id_recette`) REFERENCES `recettes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recettes_semaine`
--

LOCK TABLES `recettes_semaine` WRITE;
/*!40000 ALTER TABLE `recettes_semaine` DISABLE KEYS */;
/*!40000 ALTER TABLE `recettes_semaine` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saisons`
--

DROP TABLE IF EXISTS `saisons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saisons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saisons`
--

LOCK TABLES `saisons` WRITE;
/*!40000 ALTER TABLE `saisons` DISABLE KEYS */;
INSERT INTO `saisons` VALUES (1,'Eté'),(2,'Hiver'),(3,'Printemps'),(4,'Automne'),(5,'Hiver Automne'),(6,'Printemps Eté'),(7,'Tout');
/*!40000 ALTER TABLE `saisons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `semaines_pref`
--

DROP TABLE IF EXISTS `semaines_pref`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `semaines_pref` (
  `nom` varchar(255) NOT NULL,
  `id_user` int DEFAULT NULL,
  `id_semaine` int DEFAULT NULL,
  PRIMARY KEY (`nom`),
  KEY `nom` (`nom`),
  KEY `semaines_pref_ibfk_1` (`id_user`),
  KEY `semaines_pref_ibfk_2` (`id_semaine`),
  CONSTRAINT `semaines_pref_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `utilisateurs` (`id`),
  CONSTRAINT `semaines_pref_ibfk_2` FOREIGN KEY (`id_semaine`) REFERENCES `recettes_semaine` (`id_semaine`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `semaines_pref`
--

LOCK TABLES `semaines_pref` WRITE;
/*!40000 ALTER TABLE `semaines_pref` DISABLE KEYS */;
/*!40000 ALTER TABLE `semaines_pref` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timings`
--

DROP TABLE IF EXISTS `timings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timings`
--

LOCK TABLES `timings` WRITE;
/*!40000 ALTER TABLE `timings` DISABLE KEYS */;
INSERT INTO `timings` VALUES (1,'Matin'),(2,'Soir'),(3,'Midi'),(4,'Collation'),(5,'Midi Soir'),(6,'PreWorkout'),(7,'InWorkout');
/*!40000 ALTER TABLE `timings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateurs`
--

DROP TABLE IF EXISTS `utilisateurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) DEFAULT NULL,
  `prenom` varchar(255) DEFAULT NULL,
  `sexe` varchar(255) DEFAULT NULL,
  `mail` varchar(255) DEFAULT NULL,
  `mdp` varchar(255) DEFAULT NULL,
  `activite` varchar(255) DEFAULT NULL,
  `objectifs` varchar(255) DEFAULT NULL,
  `calories` varchar(255) DEFAULT NULL,
  `proteines` varchar(255) DEFAULT NULL,
  `lipides` varchar(255) DEFAULT NULL,
  `glucides` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateurs`
--

LOCK TABLES `utilisateurs` WRITE;
/*!40000 ALTER TABLE `utilisateurs` DISABLE KEYS */;
INSERT INTO `utilisateurs` VALUES (1,'bob','bob','M','bob@gmail.com','mdp',NULL,NULL,NULL,NULL,NULL,NULL),(2,'Dupont','Jean','Homme','jean.dupont@example.com','motdepasse','Modérée','Perdre du poids','2200','120','70','250'),(3,'Dupont','Jean','Homme','jean.dupont@example.com','motdepasse','Modérée','Perdre du poids','2200','120','70','250');
/*!40000 ALTER TABLE `utilisateurs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateurs_recettes`
--

DROP TABLE IF EXISTS `utilisateurs_recettes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs_recettes` (
  `utilisateur_id` int NOT NULL,
  `recette_id` int NOT NULL,
  PRIMARY KEY (`utilisateur_id`,`recette_id`),
  KEY `recette_id` (`recette_id`),
  CONSTRAINT `utilisateurs_recettes_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`),
  CONSTRAINT `utilisateurs_recettes_ibfk_2` FOREIGN KEY (`recette_id`) REFERENCES `recettes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateurs_recettes`
--

LOCK TABLES `utilisateurs_recettes` WRITE;
/*!40000 ALTER TABLE `utilisateurs_recettes` DISABLE KEYS */;
INSERT INTO `utilisateurs_recettes` VALUES (1,1);
/*!40000 ALTER TABLE `utilisateurs_recettes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-26 21:31:40
