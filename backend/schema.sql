CREATE DATABASE IF NOT EXISTS management_syndic;
USE management_syndic;

CREATE TABLE IF NOT EXISTS utilisateur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  telephone VARCHAR(30),
  passwd VARCHAR(255),
  role ENUM('admin','coproprietaire') DEFAULT 'coproprietaire',
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  email VARCHAR(150),
  age INT,
  date_naissance DATE
);

CREATE TABLE IF NOT EXISTS residences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT,
  nom VARCHAR(150),
  adresse VARCHAR(255),
  ville VARCHAR(100),
  code_postal VARCHAR(20),
  telephone VARCHAR(30),
  email VARCHAR(150),
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin(id)
);

CREATE TABLE IF NOT EXISTS coproprietaires (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT,
  residence_id INT,
  cin VARCHAR(30),
  date_naissance DATE,
  profession VARCHAR(100),
  date_adhesion DATE,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
  FOREIGN KEY (residence_id) REFERENCES residences(id)
);

CREATE TABLE IF NOT EXISTS appartements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  residence_id INT,
  coproprietaire_id INT,
  numero VARCHAR(20),
  etage INT,
  surface DECIMAL(10,2),
  nombre_pieces INT,
  type VARCHAR(50),
  statut ENUM('occupe','vacant','en_travaux') DEFAULT 'vacant',
  FOREIGN KEY (residence_id) REFERENCES residences(id),
  FOREIGN KEY (coproprietaire_id) REFERENCES coproprietaires(id)
);

CREATE TABLE IF NOT EXISTS charges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  residence_id INT,
  appartement_id INT,
  libelle VARCHAR(150),
  montant DECIMAL(10,2),
  periode VARCHAR(50),
  date_echeance DATE,
  statut ENUM('payee','partielle','impayee') DEFAULT 'impayee',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (residence_id) REFERENCES residences(id),
  FOREIGN KEY (appartement_id) REFERENCES appartements(id)
);

CREATE TABLE IF NOT EXISTS paiements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  charge_id INT,
  appartement_id INT,
  montant_paye DECIMAL(10,2),
  date_paiement DATE,
  mode_paiement VARCHAR(50),
  reference VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (charge_id) REFERENCES charges(id),
  FOREIGN KEY (appartement_id) REFERENCES appartements(id)
);

CREATE TABLE IF NOT EXISTS reclamations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  residence_id INT,
  appartement_id INT,
  coproprietaire_id INT,
  sujet VARCHAR(150),
  description TEXT,
  date_reclamation DATETIME DEFAULT CURRENT_TIMESTAMP,
  statut ENUM('nouvelle','en_cours','resolue') DEFAULT 'nouvelle',
  date_traitement DATETIME,
  FOREIGN KEY (residence_id) REFERENCES residences(id),
  FOREIGN KEY (appartement_id) REFERENCES appartements(id),
  FOREIGN KEY (coproprietaire_id) REFERENCES coproprietaires(id)
);

CREATE TABLE IF NOT EXISTS depenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  residence_id INT,
  categorie VARCHAR(100),
  description TEXT,
  montant DECIMAL(10,2),
  fournisseur VARCHAR(150),
  date_depense DATE,
  justificatif VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (residence_id) REFERENCES residences(id)
);

CREATE TABLE IF NOT EXISTS annonces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT,
  residence_id INT,
  titre VARCHAR(150),
  contenu TEXT,
  image VARCHAR(255),
  date_publication DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_expiration DATETIME,
  statut ENUM('brouillon','publiee','expiree') DEFAULT 'brouillon',
  FOREIGN KEY (admin_id) REFERENCES admin(id),
  FOREIGN KEY (residence_id) REFERENCES residences(id)
);

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  residence_id INT,
  admin_id INT,
  titre VARCHAR(150),
  type VARCHAR(50),
  fichier VARCHAR(255),
  date_document DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (residence_id) REFERENCES residences(id),
  FOREIGN KEY (admin_id) REFERENCES admin(id)
);
