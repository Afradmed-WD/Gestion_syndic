const express = require("express");
const bcrypt = require("bcryptjs"); // pour comparer les mots de passe hachés
const jwt = require("jsonwebtoken");
const util = require("util");
const connection = require("../db");
const router = express.Router();

// Transforme connection.query (callback) en version "Promise" pour utiliser async/await
const query = util.promisify(connection.query).bind(connection);

// Connexion
router.post("/login", (req, res) => {
  const { email, passwd } = req.body;

  connection.query(
    "SELECT * FROM utilisateur WHERE email = ?",
    [email],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(400).json({ error: "Utilisateur non trouvé" });

      if (passwd !== results[0].passwd)
        return res.status(400).json({ error: "Mot de passe incorrect" });

      // ✅ Générer un token avec email + nom
      const token = jwt.sign(
        { email: results[0].email, nom: results[0].nom },
        "SECRET_KEY",
        { expiresIn: "1h" }
      );
      res.json({ token });
    }
  );
});

// inscription
router.post("/register", async (req, res) => {
  const { nom, email, passwd } = req.body;
  connection.query(
    "INSERT INTO utilisateur (nom,email,passwd) VALUES(?,?,?)",
    [nom, email, passwd],
    (err, result) => {
      if (err) return res.status(500).json(err);

      const token = jwt.sign({ nom, email, passwd }, "SECRET_KEY", { expiresIn: "1h" });
      res.json({ token });
    }
  );
});

router.get("/admin", (req, res) => {
  connection.query("SELECT * FROM utilisateur", (_, results) => {
    res.json(results);
  });
});

/* ------------------------------------------------------------------ */
/*  DASHBOARD — données dynamiques basées sur le vrai schéma SQL       */
/* ------------------------------------------------------------------ */

// GET /dashboard → toutes les données du tableau de bord en un seul appel
router.get("/dashboard", async (req, res) => {
  try {
    // --- Copropriétaires ---
    const [{ total: totalCopro }] = await query("SELECT COUNT(*) AS total FROM coproprietaires");
    const [{ nouveaux: coproMois }] = await query(`
      SELECT COUNT(*) AS nouveaux FROM coproprietaires
      WHERE MONTH(date_adhesion) = MONTH(CURDATE()) AND YEAR(date_adhesion) = YEAR(CURDATE())
    `);

    // --- Appartements (statut enum: occupe / vacant / en_travaux) ---
    const [{ total: totalAppart }] = await query("SELECT COUNT(*) AS total FROM appartements");
    const [{ occupes }] = await query(
      "SELECT COUNT(*) AS occupes FROM appartements WHERE statut = 'occupe'"
    );

    // --- Paiements reçus ce mois (statut enum: valide / en_attente / annule) ---
    const [{ total: totalPaiements }] = await query(`
      SELECT COALESCE(SUM(montant),0) AS total FROM paiements
      WHERE statut = 'valide' AND MONTH(date_paiement) = MONTH(CURDATE()) AND YEAR(date_paiement) = YEAR(CURDATE())
    `);

    // --- Réclamations ce mois ---
    const [{ total: totalReclamations }] = await query(`
      SELECT COUNT(*) AS total FROM reclamations
      WHERE MONTH(date_creation) = MONTH(CURDATE()) AND YEAR(date_creation) = YEAR(CURDATE())
    `);

    const stats = {
      coproprietaires: { value: totalCopro, trend: `+${coproMois} ce mois` },
      appartements: { value: totalAppart, trend: `${occupes} occupés` },
      paiements: { value: totalPaiements, trend: "ce mois" },
      reclamations: { value: totalReclamations, trend: "ce mois" },
    };

    // --- Évolution des paiements (6 derniers mois) ---
    const evolution = await query(`
      SELECT DATE_FORMAT(date_paiement, '%b') AS mois,
             SUM(CASE WHEN statut = 'valide' THEN montant ELSE 0 END) AS payes,
             SUM(CASE WHEN statut != 'valide' THEN montant ELSE 0 END) AS impayes
      FROM paiements
      WHERE date_paiement >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(date_paiement, '%Y-%m')
      ORDER BY MIN(date_paiement) ASC
    `);

    // --- Répartition des charges (par libellé, pas de colonne "catégorie") ---
    const rawCharges = await query(`
      SELECT libelle AS label, SUM(montant) AS montant
      FROM charges
      GROUP BY libelle
      ORDER BY montant DESC
      LIMIT 5
    `);
    const totalCharges = rawCharges.reduce((sum, c) => sum + Number(c.montant), 0);
    const charges = rawCharges.map((c) => ({
      label: c.label,
      pct: totalCharges ? Math.round((c.montant / totalCharges) * 100) : 0,
    }));

    // --- Dernières réclamations (statut enum traduit en français) ---
    const reclamations = await query(`
      SELECT r.titre, a.numero AS appartement, r.date_creation AS date,
             CASE r.statut
               WHEN 'en_attente' THEN 'En attente'
               WHEN 'en_cours' THEN 'En cours'
               WHEN 'resolue' THEN 'Résolue'
               WHEN 'rejetee' THEN 'Rejetée'
             END AS statut
      FROM reclamations r
      LEFT JOIN appartements a ON a.id = r.appartement_id
      ORDER BY r.date_creation DESC
      LIMIT 4
    `);

    // --- Derniers paiements ---
    // paiements n'a pas d'appartement_id direct → on passe par charges
    // utilisateur n'a pas de colonne prenom → u.nom contient déjà le nom complet
    const paiements = await query(`
      SELECT u.nom AS resident, a.numero AS appartement, p.montant, p.date_paiement AS date
      FROM paiements p
      LEFT JOIN coproprietaires c ON c.id = p.coproprietaire_id
      LEFT JOIN utilisateur u ON u.id = c.utilisateur_id
      LEFT JOIN charges ch ON ch.id = p.charge_id
      LEFT JOIN appartements a ON a.id = ch.appartement_id
      ORDER BY p.date_paiement DESC
      LIMIT 4
    `);

    // --- Documents récents (colonne "titre", pas "nom") ---
    const documents = await query(`
      SELECT titre AS nom, created_at AS date
      FROM documents
      ORDER BY created_at DESC
      LIMIT 3
    `);

    res.json({ stats, evolution, charges, totalCharges, reclamations, paiements, documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement du tableau de bord" });
  }
});

// GET /coproprietaires → liste complète pour la page Copropriétaires
// coproprietaires n'a ni nom/prenom/email (→ table utilisateur) ni statut/téléphone,
// mais a un residence_id direct + cin/profession/date_naissance/date_adhesion
router.get("/coproprietaires", async (req, res) => {
  try {
    const results = await query(`
      SELECT c.id, u.nom, u.email, c.cin, c.profession,
             c.date_naissance, c.date_adhesion, r.nom AS residence
      FROM coproprietaires c
      JOIN utilisateur u ON u.id = c.utilisateur_id
      LEFT JOIN residences r ON r.id = c.residence_id
      ORDER BY c.date_adhesion DESC
    `);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des copropriétaires" });
  }
});

// GET /appartements → stats + liste complète pour la page Appartements
// appartements n'a pas de date_acquisition ; le propriétaire vient de coproprietaire_id → utilisateur
router.get("/appartements", async (req, res) => {
  try {
    const [{ total }] = await query("SELECT COUNT(*) AS total FROM appartements");
    const [{ occupes }] = await query("SELECT COUNT(*) AS occupes FROM appartements WHERE statut = 'occupe'");
    const [{ vacants }] = await query("SELECT COUNT(*) AS vacants FROM appartements WHERE statut = 'vacant'");
    const [{ maintenance }] = await query("SELECT COUNT(*) AS maintenance FROM appartements WHERE statut = 'en_travaux'");

    const appartements = await query(`
      SELECT a.id, a.numero, a.etage, a.surface, a.nombre_pieces, a.type,
             CASE a.statut
               WHEN 'occupe' THEN 'Occupé'
               WHEN 'vacant' THEN 'Vacant'
               WHEN 'en_travaux' THEN 'En maintenance'
             END AS statut,
             r.nom AS residence, u.nom AS proprietaire
      FROM appartements a
      LEFT JOIN residences r ON r.id = a.residence_id
      LEFT JOIN coproprietaires c ON c.id = a.coproprietaire_id
      LEFT JOIN utilisateur u ON u.id = c.utilisateur_id
      ORDER BY a.numero ASC
    `);

    res.json({ stats: { total, occupes, vacants, maintenance }, appartements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des appartements" });
  }
});

// GET /charges → stats + liste complète pour la page Charges
// charges n'a pas de colonne "categorie" (juste "libelle") ni de statut "en_attente"
// (l'enum réel est payee/partielle/impayee, traduit ici en Payée/En attente/En retard)
router.get("/charges", async (req, res) => {
  try {
    const [{ total }] = await query(`
      SELECT COALESCE(SUM(montant),0) AS total FROM charges
      WHERE MONTH(date_echeance) = MONTH(CURDATE()) AND YEAR(date_echeance) = YEAR(CURDATE())
    `);
    const [{ payees }] = await query("SELECT COALESCE(SUM(montant),0) AS payees FROM charges WHERE statut = 'payee'");
    const [{ attente }] = await query("SELECT COALESCE(SUM(montant),0) AS attente FROM charges WHERE statut = 'partielle'");
    const [{ retard }] = await query("SELECT COALESCE(SUM(montant),0) AS retard FROM charges WHERE statut = 'impayee'");

    const charges = await query(`
      SELECT c.id, c.libelle, c.montant, c.periode, c.date_echeance,
             CASE c.statut
               WHEN 'payee' THEN 'Payée'
               WHEN 'partielle' THEN 'En attente'
               WHEN 'impayee' THEN 'En retard'
             END AS statut,
             r.nom AS residence, a.numero AS appartement
      FROM charges c
      LEFT JOIN residences r ON r.id = c.residence_id
      LEFT JOIN appartements a ON a.id = c.appartement_id
      ORDER BY c.date_echeance DESC
    `);

    res.json({ stats: { total, payees, attente, retard }, charges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des charges" });
  }
});

// GET /paiements → stats + liste complète pour la page Paiements
// paiements n'a pas d'appartement_id direct (→ via charges) ni de statut "en retard"
// (l'enum réel est valide/en_attente/annule, traduit ici en Payé/En attente/Annulé)
router.get("/paiements", async (req, res) => {
  try {
    const [{ total }] = await query(`
      SELECT COALESCE(SUM(montant),0) AS total FROM paiements
      WHERE statut = 'valide' AND MONTH(date_paiement) = MONTH(CURDATE()) AND YEAR(date_paiement) = YEAR(CURDATE())
    `);
    const [{ payes }] = await query("SELECT COALESCE(SUM(montant),0) AS payes FROM paiements WHERE statut = 'valide'");
    const [{ attente }] = await query("SELECT COALESCE(SUM(montant),0) AS attente FROM paiements WHERE statut = 'en_attente'");
    const [{ annules }] = await query("SELECT COALESCE(SUM(montant),0) AS annules FROM paiements WHERE statut = 'annule'");

    const paiements = await query(`
      SELECT p.id, u.nom AS resident, a.numero AS appartement, p.montant,
             CASE p.mode_paiement
               WHEN 'especes' THEN 'Espèces'
               WHEN 'virement' THEN 'Virement'
               WHEN 'carte' THEN 'Carte'
               WHEN 'cheque' THEN 'Chèque'
             END AS mode,
             p.date_paiement AS date,
             CASE p.statut
               WHEN 'valide' THEN 'Payé'
               WHEN 'en_attente' THEN 'En attente'
               WHEN 'annule' THEN 'Annulé'
             END AS statut
      FROM paiements p
      LEFT JOIN coproprietaires c ON c.id = p.coproprietaire_id
      LEFT JOIN utilisateur u ON u.id = c.utilisateur_id
      LEFT JOIN charges ch ON ch.id = p.charge_id
      LEFT JOIN appartements a ON a.id = ch.appartement_id
      ORDER BY p.date_paiement DESC
    `);

    res.json({ stats: { total, payes, attente, annules }, paiements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des paiements" });
  }
});

module.exports = router;