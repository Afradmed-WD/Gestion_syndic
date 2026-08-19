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

/* ------------------------------------------------------------------ */
/*  COPROPRIÉTAIRES — CRUD complet                                     */
/* ------------------------------------------------------------------ */

// GET /residences → pour remplir le select dans le formulaire du frontend
router.get("/residences", async (req, res) => {
  try {
    const residences = await query("SELECT id, nom FROM residences ORDER BY nom ASC");
    res.json(residences);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des résidences" });
  }
});

// GET /coproprietaires → liste complète pour la page Copropriétaires
// coproprietaires n'a ni nom/prenom/email (→ table utilisateur) ni statut/téléphone,
// mais a un residence_id direct + cin/profession/date_naissance/date_adhesion
router.get("/coproprietaires", async (req, res) => {
  try {
    const results = await query(`
      SELECT c.id, u.nom, u.email, c.cin, c.profession,
             c.date_naissance, c.date_adhesion, c.residence_id, r.nom AS residence
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

// GET /coproprietaires/:id → un seul copropriétaire (utile pour la popup "voir")
router.get("/coproprietaires/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const results = await query(
      `
      SELECT c.id, u.nom, u.email, c.cin, c.profession,
             c.date_naissance, c.date_adhesion, c.residence_id, r.nom AS residence
      FROM coproprietaires c
      JOIN utilisateur u ON u.id = c.utilisateur_id
      LEFT JOIN residences r ON r.id = c.residence_id
      WHERE c.id = ?
    `,
      [id]
    );
    if (results.length === 0) return res.status(404).json({ error: "Copropriétaire introuvable" });
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement du copropriétaire" });
  }
});

// POST /coproprietaires → créer un copropriétaire (crée aussi l'utilisateur lié)
router.post("/coproprietaires", async (req, res) => {
  const { nom, email, passwd, cin, profession, date_naissance, date_adhesion, residence_id } = req.body;

  if (!nom || !email) {
    return res.status(400).json({ error: "Nom et email requis" });
  }

  try {
    const hashedPasswd = await bcrypt.hash(passwd || "changeme123", 10);

    const userResult = await query(
      "INSERT INTO utilisateur (nom, email, passwd) VALUES (?, ?, ?)",
      [nom, email, hashedPasswd]
    );
    const utilisateur_id = userResult.insertId;

    const coproResult = await query(
      `INSERT INTO coproprietaires (utilisateur_id, cin, profession, date_naissance, date_adhesion, residence_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [utilisateur_id, cin || null, profession || null, date_naissance || null, date_adhesion || new Date(), residence_id || null]
    );

    res.status(201).json({ id: coproResult.insertId, message: "Copropriétaire créé" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }
    res.status(500).json({ error: "Erreur lors de la création du copropriétaire" });
  }
});

// PUT /coproprietaires/:id → modifier un copropriétaire
router.put("/coproprietaires/:id", async (req, res) => {
  const { id } = req.params;
  const { nom, email, cin, profession, date_naissance, date_adhesion, residence_id } = req.body;

  if (!nom || !email) {
    return res.status(400).json({ error: "Nom et email requis" });
  }

  try {
    const rows = await query("SELECT utilisateur_id FROM coproprietaires WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Copropriétaire introuvable" });
    const utilisateur_id = rows[0].utilisateur_id;

    await query("UPDATE utilisateur SET nom = ?, email = ? WHERE id = ?", [nom, email, utilisateur_id]);

    await query(
      `UPDATE coproprietaires SET cin = ?, profession = ?, date_naissance = ?, date_adhesion = ?, residence_id = ?
       WHERE id = ?`,
      [cin || null, profession || null, date_naissance || null, date_adhesion || null, residence_id || null, id]
    );

    res.json({ message: "Copropriétaire mis à jour" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }
    res.status(500).json({ error: "Erreur lors de la mise à jour du copropriétaire" });
  }
});

// DELETE /coproprietaires/:id → supprimer un copropriétaire (et l'utilisateur lié)
router.delete("/coproprietaires/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query("SELECT utilisateur_id FROM coproprietaires WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Copropriétaire introuvable" });

    await query("DELETE FROM coproprietaires WHERE id = ?", [id]);
    await query("DELETE FROM utilisateur WHERE id = ?", [rows[0].utilisateur_id]);

    res.json({ message: "Copropriétaire supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression du copropriétaire" });
  }
});

/* ------------------------------------------------------------------ */
/*  APPARTEMENTS                                                       */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  CHARGES                                                             */
/* ------------------------------------------------------------------ */

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
router.get("/charges/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const results = await query(
      `
      SELECT c.id, c.libelle, c.montant, c.periode, c.date_echeance, c.statut,
             c.residence_id, c.appartement_id,
             r.nom AS residence, a.numero AS appartement
      FROM charges c
      LEFT JOIN residences r ON r.id = c.residence_id
      LEFT JOIN appartements a ON a.id = c.appartement_id
      WHERE c.id = ?
      `,
      [id]
    );
    if (results.length === 0) return res.status(404).json({ error: "Charge introuvable" });
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement de la charge" });
  }
});
 
// POST /charges → créer une charge
router.post("/charges", async (req, res) => {
  const { libelle, montant, periode, date_echeance, statut, residence_id, appartement_id } = req.body;
 
  if (!libelle || !montant) {
    return res.status(400).json({ error: "Libellé et montant requis" });
  }
 
  try {
    const result = await query(
      `INSERT INTO charges (libelle, montant, periode, date_echeance, statut, residence_id, appartement_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        libelle,
        montant,
        periode || null,
        date_echeance || null,
        statut || "impayee",
        residence_id || null,
        appartement_id || null,
      ]
    );
    res.status(201).json({ id: result.insertId, message: "Charge créée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création de la charge" });
  }
});
 
// PUT /charges/:id → modifier une charge
router.put("/charges/:id", async (req, res) => {
  const { id } = req.params;
  const { libelle, montant, periode, date_echeance, statut, residence_id, appartement_id } = req.body;
 
  if (!libelle || !montant) {
    return res.status(400).json({ error: "Libellé et montant requis" });
  }
 
  try {
    const rows = await query("SELECT id FROM charges WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Charge introuvable" });
 
    await query(
      `UPDATE charges
       SET libelle = ?, montant = ?, periode = ?, date_echeance = ?, statut = ?, residence_id = ?, appartement_id = ?
       WHERE id = ?`,
      [libelle, montant, periode || null, date_echeance || null, statut, residence_id || null, appartement_id || null, id]
    );
 
    res.json({ message: "Charge mise à jour" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour de la charge" });
  }
});
 
// DELETE /charges/:id → supprimer une charge
router.delete("/charges/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("DELETE FROM charges WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Charge introuvable" });
    res.json({ message: "Charge supprimée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression de la charge" });
  }
});
 
/* ------------------------------------------------------------------ */
/*  PAIEMENTS                                                           */
/* ------------------------------------------------------------------ */

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

router.get("/reclamations", async (req, res) => {
  try {
    const [{ total }] = await query(`
      SELECT COUNT(*) AS total FROM reclamations
      WHERE MONTH(date_creation) = MONTH(CURDATE()) AND YEAR(date_creation) = YEAR(CURDATE())
    `);
    const [{ resolues }] = await query("SELECT COUNT(*) AS resolues FROM reclamations WHERE statut = 'resolue'");
    const [{ enCours }] = await query("SELECT COUNT(*) AS enCours FROM reclamations WHERE statut = 'en_cours'");
    const [{ rejetees }] = await query("SELECT COUNT(*) AS rejetees FROM reclamations WHERE statut = 'rejetee'");
 
    const reclamations = await query(`
      SELECT r.id, r.titre, u.nom AS resident, a.numero AS appartement, r.categorie,
             CASE r.priorite
               WHEN 'basse' THEN 'Basse'
               WHEN 'normale' THEN 'Moyenne'
               WHEN 'haute' THEN 'Haute'
               WHEN 'urgente' THEN 'Urgente'
             END AS priorite,
             CASE r.statut
               WHEN 'en_attente' THEN 'En attente'
               WHEN 'en_cours' THEN 'En cours'
               WHEN 'resolue' THEN 'Résolue'
               WHEN 'rejetee' THEN 'Rejetée'
             END AS statut,
             r.date_creation AS date
      FROM reclamations r
      LEFT JOIN coproprietaires c ON c.id = r.coproprietaire_id
      LEFT JOIN utilisateur u ON u.id = c.utilisateur_id
      LEFT JOIN appartements a ON a.id = r.appartement_id
      ORDER BY r.date_creation DESC
    `);
 
    res.json({ stats: { total, resolues, enCours, rejetees }, reclamations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des réclamations" });
  }
});

 router.get("/paiements/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const results = await query(
      `
      SELECT p.id, p.coproprietaire_id, p.charge_id, u.nom AS resident,
             a.numero AS appartement, p.montant, p.mode_paiement,
             p.date_paiement AS date, p.statut
      FROM paiements p
      LEFT JOIN coproprietaires c ON c.id = p.coproprietaire_id
      LEFT JOIN utilisateur u ON u.id = c.utilisateur_id
      LEFT JOIN charges ch ON ch.id = p.charge_id
      LEFT JOIN appartements a ON a.id = ch.appartement_id
      WHERE p.id = ?
      `,
      [id]
    );
    if (results.length === 0) return res.status(404).json({ error: "Paiement introuvable" });
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement du paiement" });
  }
});
 
// POST /paiements → créer un paiement
router.post("/paiements", async (req, res) => {
  const { coproprietaire_id, charge_id, montant, mode_paiement, date_paiement, statut } = req.body;
 
  if (!coproprietaire_id || !montant) {
    return res.status(400).json({ error: "Copropriétaire et montant requis" });
  }
 
  try {
    const result = await query(
      `INSERT INTO paiements (coproprietaire_id, charge_id, montant, mode_paiement, date_paiement, statut)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        coproprietaire_id,
        charge_id || null,
        montant,
        mode_paiement || "especes",
        date_paiement || new Date(),
        statut || "en_attente",
      ]
    );
    res.status(201).json({ id: result.insertId, message: "Paiement créé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
});
 
// PUT /paiements/:id → modifier un paiement
router.put("/paiements/:id", async (req, res) => {
  const { id } = req.params;
  const { coproprietaire_id, charge_id, montant, mode_paiement, date_paiement, statut } = req.body;
 
  if (!coproprietaire_id || !montant) {
    return res.status(400).json({ error: "Copropriétaire et montant requis" });
  }
 
  try {
    const rows = await query("SELECT id FROM paiements WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Paiement introuvable" });
 
    await query(
      `UPDATE paiements
       SET coproprietaire_id = ?, charge_id = ?, montant = ?, mode_paiement = ?, date_paiement = ?, statut = ?
       WHERE id = ?`,
      [coproprietaire_id, charge_id || null, montant, mode_paiement, date_paiement, statut, id]
    );
 
    res.json({ message: "Paiement mis à jour" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour du paiement" });
  }
});
 
// DELETE /paiements/:id → supprimer un paiement
router.delete("/paiements/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("DELETE FROM paiements WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Paiement introuvable" });
    res.json({ message: "Paiement supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression du paiement" });
  }
});
 
 
router.get("/appartements/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const results = await query(
      `
      SELECT a.id, a.numero, a.etage, a.surface, a.nombre_pieces, a.type, a.statut,
             a.residence_id, a.coproprietaire_id,
             r.nom AS residence, u.nom AS proprietaire
      FROM appartements a
      LEFT JOIN residences r ON r.id = a.residence_id
      LEFT JOIN coproprietaires c ON c.id = a.coproprietaire_id
      LEFT JOIN utilisateur u ON u.id = c.utilisateur_id
      WHERE a.id = ?
      `,
      [id]
    );
    if (results.length === 0) return res.status(404).json({ error: "Appartement introuvable" });
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement de l'appartement" });
  }
});
 
// POST /appartements → créer un appartement
router.post("/appartements", async (req, res) => {
  const { numero, etage, surface, nombre_pieces, type, statut, residence_id, coproprietaire_id } = req.body;
 
  if (!numero) {
    return res.status(400).json({ error: "Le numéro d'appartement est requis" });
  }
 
  try {
    const result = await query(
      `INSERT INTO appartements (numero, etage, surface, nombre_pieces, type, statut, residence_id, coproprietaire_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero,
        etage || null,
        surface || null,
        nombre_pieces || null,
        type || null,
        statut || "vacant",
        residence_id || null,
        coproprietaire_id || null,
      ]
    );
    res.status(201).json({ id: result.insertId, message: "Appartement créé" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Ce numéro d'appartement existe déjà" });
    }
    res.status(500).json({ error: "Erreur lors de la création de l'appartement" });
  }
});
 
// PUT /appartements/:id → modifier un appartement
router.put("/appartements/:id", async (req, res) => {
  const { id } = req.params;
  const { numero, etage, surface, nombre_pieces, type, statut, residence_id, coproprietaire_id } = req.body;
 
  if (!numero) {
    return res.status(400).json({ error: "Le numéro d'appartement est requis" });
  }
 
  try {
    const rows = await query("SELECT id FROM appartements WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Appartement introuvable" });
 
    await query(
      `UPDATE appartements
       SET numero = ?, etage = ?, surface = ?, nombre_pieces = ?, type = ?, statut = ?, residence_id = ?, coproprietaire_id = ?
       WHERE id = ?`,
      [
        numero,
        etage || null,
        surface || null,
        nombre_pieces || null,
        type || null,
        statut,
        residence_id || null,
        coproprietaire_id || null,
        id,
      ]
    );
 
    res.json({ message: "Appartement mis à jour" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Ce numéro d'appartement existe déjà" });
    }
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'appartement" });
  }
});
 
// DELETE /appartements/:id → supprimer un appartement
router.delete("/appartements/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("DELETE FROM appartements WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Appartement introuvable" });
    res.json({ message: "Appartement supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression de l'appartement" });
  }
});
 router.get("/annonces", async (req, res) => {
  try {
    const [{ total }] = await query(`
      SELECT COUNT(*) AS total FROM annonces
      WHERE MONTH(date_publication) = MONTH(CURDATE()) AND YEAR(date_publication) = YEAR(CURDATE())
    `);
    const [{ publiees }] = await query("SELECT COUNT(*) AS publiees FROM annonces WHERE statut = 'publiee'");
    const [{ planifiees }] = await query("SELECT COUNT(*) AS planifiees FROM annonces WHERE statut = 'planifiee'");
    const [{ expirees }] = await query("SELECT COUNT(*) AS expirees FROM annonces WHERE statut = 'expiree'");
 
    const annonces = await query(`
      SELECT a.id, a.titre, a.contenu, a.image,
             a.date_publication, a.date_expiration,
             CASE a.statut
               WHEN 'publiee' THEN 'Publiée'
               WHEN 'planifiee' THEN 'Planifiée'
               WHEN 'expiree' THEN 'Expirée'
             END AS statut,
             a.residence_id, r.nom AS residence,
             a.admin_id, u.nom AS publie_par
      FROM annonces a
      LEFT JOIN residences r ON r.id = a.residence_id
      LEFT JOIN utilisateur u ON u.id = a.admin_id
      ORDER BY a.date_publication DESC
    `);
 
    res.json({ stats: { total, publiees, planifiees, expirees }, annonces });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des annonces" });
  }
});
 
// GET /annonces/:id → une seule annonce avec ses valeurs brutes
// (utile pour préremplir le formulaire de modification)
router.get("/annonces/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const results = await query(
      `
      SELECT a.id, a.titre, a.contenu, a.image, a.statut,
             a.date_publication, a.date_expiration,
             a.residence_id, r.nom AS residence,
             a.admin_id, u.nom AS publie_par
      FROM annonces a
      LEFT JOIN residences r ON r.id = a.residence_id
      LEFT JOIN utilisateur u ON u.id = a.admin_id
      WHERE a.id = ?
      `,
      [id]
    );
    if (results.length === 0) return res.status(404).json({ error: "Annonce introuvable" });
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement de l'annonce" });
  }
});
 
// POST /annonces → créer une annonce
router.post("/annonces", async (req, res) => {
  const { titre, contenu, image, date_publication, date_expiration, statut, residence_id, admin_id } = req.body;
 
  if (!titre) {
    return res.status(400).json({ error: "Le titre est requis" });
  }
 
  try {
    const result = await query(
      `INSERT INTO annonces (admin_id, residence_id, titre, contenu, image, date_publication, date_expiration, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        admin_id || req.user?.id || null, // adapte selon comment tu identifies l'admin connecté (ex: depuis le token)
        residence_id || null,
        titre,
        contenu || null,
        image || null,
        date_publication || new Date(),
        date_expiration || null,
        statut || "planifiee",
      ]
    );
    res.status(201).json({ id: result.insertId, message: "Annonce créée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création de l'annonce" });
  }
});
 
// PUT /annonces/:id → modifier une annonce
router.put("/annonces/:id", async (req, res) => {
  const { id } = req.params;
  const { titre, contenu, image, date_publication, date_expiration, statut, residence_id, admin_id } = req.body;
 
  if (!titre) {
    return res.status(400).json({ error: "Le titre est requis" });
  }
 
  try {
    const rows = await query("SELECT id FROM annonces WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Annonce introuvable" });
 
    await query(
      `UPDATE annonces
       SET titre = ?, contenu = ?, image = ?, date_publication = ?, date_expiration = ?, statut = ?, residence_id = ?, admin_id = ?
       WHERE id = ?`,
      [
        titre,
        contenu || null,
        image || null,
        date_publication || null,
        date_expiration || null,
        statut,
        residence_id || null,
        admin_id || null,
        id,
      ]
    );
 
    res.json({ message: "Annonce mise à jour" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'annonce" });
  }
});
 
// DELETE /annonces/:id → supprimer une annonce
router.delete("/annonces/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("DELETE FROM annonces WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Annonce introuvable" });
    res.json({ message: "Annonce supprimée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression de l'annonce" });
  }
});

router.get("/factures", async (req, res) => {

  try {


    const [{ total }] = await query(`
      SELECT COUNT(*) AS total
      FROM factures
      WHERE MONTH(date_emission) = MONTH(CURDATE())
        AND YEAR(date_emission) = YEAR(CURDATE())
    `);

    const [{ montantTotal }] = await query(`
      SELECT COALESCE(SUM(montant), 0) AS montantTotal
      FROM factures
      WHERE MONTH(date_emission) = MONTH(CURDATE())
        AND YEAR(date_emission) = YEAR(CURDATE())
    `);


    /* ---------------------- Payées ------------------------------ */

    const [{ payees }] = await query(`
      SELECT COUNT(*) AS payees
      FROM factures
      WHERE statut = 'payee'
        AND MONTH(date_emission) = MONTH(CURDATE())
        AND YEAR(date_emission) = YEAR(CURDATE())
    `);


    /* ---------------------- Impayées ---------------------------- */

    const [{ impayees }] = await query(`
      SELECT COUNT(*) AS impayees
      FROM factures
      WHERE statut = 'impayee'
        AND MONTH(date_emission) = MONTH(CURDATE())
        AND YEAR(date_emission) = YEAR(CURDATE())
    `);


    /* ---------------------- Liste ------------------------------- */

    const factures = await query(`
      SELECT

        f.id,
        f.numero,

        f.coproprietaire_id,
        f.appartement_id,
        f.residence_id,

        f.date_emission,
        f.date_echeance,

        f.montant,
        f.statut,
        f.description,

        f.created_at,
        f.updated_at,

        u.nom AS resident,

        a.numero AS appartement,

        r.nom AS residence

      FROM factures f

      LEFT JOIN coproprietaires c
        ON c.id = f.coproprietaire_id

      LEFT JOIN utilisateur u
        ON u.id = c.utilisateur_id

      LEFT JOIN appartements a
        ON a.id = f.appartement_id

      LEFT JOIN residences r
        ON r.id = f.residence_id

      ORDER BY
        f.date_emission DESC,
        f.id DESC
    `);


    res.json({

      stats: {
        total: Number(total),
        montantTotal: Number(montantTotal),
        payees: Number(payees),
        impayees: Number(impayees)
      },

      factures

    });

  } catch (err) {

    console.error(
      "GET /factures ERROR :",
      err
    );

    res.status(500).json({
      error:
        "Erreur lors du chargement des factures"
    });

  }

});


/* ---------------------------------------------------------------- */
/* GET /factures/form-data                                          */
/* Données nécessaires au formulaire                                */
/* ---------------------------------------------------------------- */

router.get("/factures/form-data", async (req, res) => {

  try {

    const coproprietaires = await query(`
      SELECT
        c.id,
        c.residence_id,
        u.nom
      FROM coproprietaires c
      JOIN utilisateur u
        ON u.id = c.utilisateur_id
      ORDER BY u.nom ASC
    `);


    const appartements = await query(`
      SELECT
        a.id,
        a.numero,
        a.residence_id,
        a.coproprietaire_id,
        r.nom AS residence

      FROM appartements a

      LEFT JOIN residences r
        ON r.id = a.residence_id

      ORDER BY a.numero ASC
    `);


    const residences = await query(`
      SELECT
        id,
        nom
      FROM residences
      ORDER BY nom ASC
    `);


    res.json({
      coproprietaires,
      appartements,
      residences
    });

  } catch (err) {

    console.error(
      "GET /factures/form-data ERROR :",
      err
    );

    res.status(500).json({
      error:
        "Erreur lors du chargement des données du formulaire"
    });

  }

});


/* ---------------------------------------------------------------- */
/* GET /factures/:id                                                 */
/* ---------------------------------------------------------------- */

router.get("/factures/:id", async (req, res) => {

  const id = Number(req.params.id);


  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {

    return res.status(400).json({
      error: "ID de facture invalide"
    });

  }


  try {

    const rows = await query(
      `
      SELECT

        f.id,
        f.numero,

        f.coproprietaire_id,
        f.appartement_id,
        f.residence_id,

        f.date_emission,
        f.date_echeance,

        f.montant,
        f.statut,
        f.description,

        u.nom AS resident,

        a.numero AS appartement,

        r.nom AS residence

      FROM factures f

      LEFT JOIN coproprietaires c
        ON c.id = f.coproprietaire_id

      LEFT JOIN utilisateur u
        ON u.id = c.utilisateur_id

      LEFT JOIN appartements a
        ON a.id = f.appartement_id

      LEFT JOIN residences r
        ON r.id = f.residence_id

      WHERE f.id = ?

      LIMIT 1
      `,
      [id]
    );


    if (!rows.length) {

      return res.status(404).json({
        error:
          "Facture introuvable"
      });

    }


    res.json(rows[0]);

  } catch (err) {

    console.error(
      "GET /factures/:id ERROR :",
      err
    );

    res.status(500).json({
      error:
        "Erreur lors du chargement de la facture"
    });

  }

});


/* ---------------------------------------------------------------- */
/* POST /factures                                                    */
/* ---------------------------------------------------------------- */

router.post("/factures", async (req, res) => {

  const {

    numero,

    coproprietaire_id,
    appartement_id,
    residence_id,

    date_emission,
    date_echeance,

    montant,
    statut,

    description

  } = req.body;


  /* ---------------------- Vérifications ------------------------- */

  if (
    !coproprietaire_id ||
    !montant ||
    !date_emission
  ) {

    return res.status(400).json({
      error:
        "Résident, montant et date d'émission requis"
    });

  }


  const montantNumber =
    Number(montant);


  if (
    !Number.isFinite(montantNumber) ||
    montantNumber <= 0
  ) {

    return res.status(400).json({
      error:
        "Le montant doit être supérieur à 0"
    });

  }


  const statutsAutorises = [
    "payee",
    "en_attente",
    "impayee"
  ];


  if (
    statut &&
    !statutsAutorises.includes(statut)
  ) {

    return res.status(400).json({
      error:
        "Statut de facture invalide"
    });

  }


  try {

    /* ------------------------------------------------------------ */
    /* Numéro automatique si aucun numéro n'est fourni              */
    /* ------------------------------------------------------------ */

    let numeroFacture =
      numero?.trim();


    if (!numeroFacture) {

      const [{ prochainNumero }] =
        await query(`
          SELECT
            COALESCE(MAX(id), 0) + 1
            AS prochainNumero
          FROM factures
        `);


      numeroFacture =
        `FAC-${new Date().getFullYear()}-${String(
          prochainNumero
        ).padStart(3, "0")}`;

    }


    const result = await query(
      `
      INSERT INTO factures
      (
        numero,

        coproprietaire_id,
        appartement_id,
        residence_id,

        date_emission,
        date_echeance,

        montant,
        statut,

        description
      )

      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [

        numeroFacture,

        coproprietaire_id,

        appartement_id || null,

        residence_id || null,

        date_emission,

        date_echeance || null,

        montantNumber,

        statut || "en_attente",

        description?.trim() || null

      ]
    );


    res.status(201).json({

      id:
        result.insertId,

      numero:
        numeroFacture,

      message:
        "Facture créée avec succès"

    });

  } catch (err) {

    console.error(
      "POST /factures ERROR :",
      err
    );


    if (
      err.code ===
      "ER_DUP_ENTRY"
    ) {

      return res.status(409).json({
        error:
          "Ce numéro de facture existe déjà"
      });

    }


    if (
      err.code ===
      "ER_NO_REFERENCED_ROW_2"
    ) {

      return res.status(400).json({
        error:
          "Résident, appartement ou résidence invalide"
      });

    }


    res.status(500).json({
      error:
        "Erreur lors de la création de la facture"
    });

  }

});


/* ---------------------------------------------------------------- */
/* PUT /factures/:id                                                 */
/* ---------------------------------------------------------------- */

router.put("/factures/:id", async (req, res) => {

  const id =
    Number(req.params.id);


  const {

    numero,

    coproprietaire_id,
    appartement_id,
    residence_id,

    date_emission,
    date_echeance,

    montant,
    statut,

    description

  } = req.body;


  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {

    return res.status(400).json({
      error:
        "ID de facture invalide"
    });

  }


  if (
    !numero ||
    !coproprietaire_id ||
    !montant ||
    !date_emission
  ) {

    return res.status(400).json({
      error:
        "Numéro, résident, montant et date requis"
    });

  }


  const montantNumber =
    Number(montant);


  if (
    !Number.isFinite(montantNumber) ||
    montantNumber <= 0
  ) {

    return res.status(400).json({
      error:
        "Montant invalide"
    });

  }


  try {

    const rows = await query(
      `
      SELECT id
      FROM factures
      WHERE id = ?
      `,
      [id]
    );


    if (!rows.length) {

      return res.status(404).json({
        error:
          "Facture introuvable"
      });

    }


    await query(
      `
      UPDATE factures

      SET

        numero = ?,

        coproprietaire_id = ?,
        appartement_id = ?,
        residence_id = ?,

        date_emission = ?,
        date_echeance = ?,

        montant = ?,
        statut = ?,

        description = ?

      WHERE id = ?
      `,
      [

        numero.trim(),

        coproprietaire_id,

        appartement_id || null,

        residence_id || null,

        date_emission,

        date_echeance || null,

        montantNumber,

        statut || "en_attente",

        description?.trim() || null,

        id

      ]
    );


    res.json({
      message:
        "Facture mise à jour avec succès"
    });

  } catch (err) {

    console.error(
      "PUT /factures/:id ERROR :",
      err
    );


    if (
      err.code ===
      "ER_DUP_ENTRY"
    ) {

      return res.status(409).json({
        error:
          "Ce numéro de facture existe déjà"
      });

    }


    res.status(500).json({
      error:
        "Erreur lors de la mise à jour de la facture"
    });

  }

});


/* ---------------------------------------------------------------- */
/* DELETE /factures/:id                                              */
/* ---------------------------------------------------------------- */

router.delete("/factures/:id", async (req, res) => {

  const id =
    Number(req.params.id);


  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {

    return res.status(400).json({
      error:
        "ID invalide"
    });

  }


  try {

    const result =
      await query(
        `
        DELETE FROM factures
        WHERE id = ?
        `,
        [id]
      );


    if (
      result.affectedRows === 0
    ) {

      return res.status(404).json({
        error:
          "Facture introuvable"
      });

    }


    res.json({
      message:
        "Facture supprimée avec succès"
    });

  } catch (err) {

    console.error(
      "DELETE /factures/:id ERROR :",
      err
    );


    res.status(500).json({
      error:
        "Erreur lors de la suppression de la facture"
    });

  }

});
// Sécurité : s'assurer que le dossier existe à chaque appel, pas seulement au démarrage
function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
}

// GET /rapports/ping → route de test rapide pour vérifier que le routeur répond
router.get("/rapports/ping", (req, res) => {
  res.json({ ok: true, message: "Le routeur rapports fonctionne" });
});

router.post("/rapports", async (req, res) => {
  console.log("📄 POST /rapports reçu :", req.body);

  const { titre, type, periode_debut, periode_fin, residence_id } = req.body;

  if (!titre || !periode_debut || !periode_fin) {
    return res.status(400).json({ error: "Titre et période (début/fin) requis" });
  }

  try {
    ensureUploadsDir();

    const residenceClause = residence_id ? "AND residence_id = ?" : "";
    const residenceParam = residence_id ? [residence_id] : [];

    // Chaque agrégat est isolé : si une requête échoue (colonne inexistante...),
    // on log l'erreur précise et on continue avec 0 au lieu de tout faire planter.
    const safeQuery = async (label, sql, params) => {
      try {
        const rows = await query(sql, params);
        return rows[0] ? Object.values(rows[0])[0] : 0;
      } catch (e) {
        console.error(`🔴 Erreur SQL sur "${label}":`, e.message);
        return 0;
      }
    };

    const totalPaiements = await safeQuery(
      "totalPaiements",
      `SELECT COALESCE(SUM(p.montant),0) AS v FROM paiements p
       LEFT JOIN charges ch ON ch.id = p.charge_id
       WHERE p.statut = 'valide' AND p.date_paiement BETWEEN ? AND ? ${residence_id ? "AND ch.residence_id = ?" : ""}`,
      [periode_debut, periode_fin, ...residenceParam]
    );
    const totalCharges = await safeQuery(
      "totalCharges",
      `SELECT COALESCE(SUM(montant),0) AS v FROM charges WHERE date_echeance BETWEEN ? AND ? ${residenceClause}`,
      [periode_debut, periode_fin, ...residenceParam]
    );
    const totalDepenses = await safeQuery(
      "totalDepenses",
      `SELECT COALESCE(SUM(montant),0) AS v FROM depenses WHERE date_depense BETWEEN ? AND ? ${residenceClause}`,
      [periode_debut, periode_fin, ...residenceParam]
    );
    const totalFactures = await safeQuery(
      "totalFactures",
      `SELECT COALESCE(SUM(montant),0) AS v FROM factures WHERE date_emission BETWEEN ? AND ? ${residenceClause}`,
      [periode_debut, periode_fin, ...residenceParam]
    );
    const nbReclamations = await safeQuery(
      "nbReclamations",
      `SELECT COUNT(*) AS v FROM reclamations WHERE date_creation BETWEEN ? AND ?`,
      [periode_debut, periode_fin]
    );

    console.log("✅ Agrégats calculés :", { totalPaiements, totalCharges, totalDepenses, totalFactures, nbReclamations });

    // --- Génération du PDF, isolée dans son propre try/catch ---
    const filename = `rapport_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, filename);

    await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        stream.on("finish", resolve);
        stream.on("error", (e) => reject(e));
        doc.on("error", (e) => reject(e));

        doc.pipe(stream);

        doc.fontSize(20).font("Helvetica-Bold").text(titre, { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica").fillColor("#666")
          .text(`Période du ${periode_debut} au ${periode_fin}`, { align: "center" });
        doc.moveDown(2);

        const lignes = [
          ["Paiements reçus (validés)", `${Number(totalPaiements).toFixed(2)} MAD`],
          ["Charges émises", `${Number(totalCharges).toFixed(2)} MAD`],
          ["Dépenses engagées", `${Number(totalDepenses).toFixed(2)} MAD`],
          ["Factures émises", `${Number(totalFactures).toFixed(2)} MAD`],
          ["Solde (paiements - dépenses)", `${(Number(totalPaiements) - Number(totalDepenses)).toFixed(2)} MAD`],
          ["Réclamations enregistrées", `${nbReclamations}`],
        ];

        doc.fontSize(13).fillColor("#000").font("Helvetica-Bold").text("Synthèse");
        doc.moveDown(0.5);
        lignes.forEach(([label, value]) => {
          doc.fontSize(11).font("Helvetica").fillColor("#333").text(label, 50, doc.y, { continued: true, width: 350 });
          doc.font("Helvetica-Bold").text(value, { align: "right" });
          doc.moveDown(0.3);
        });

        doc.moveDown(2);
        doc.fontSize(9).fillColor("#999").text(`Généré le ${new Date().toLocaleString("fr-FR")}`, { align: "center" });

        doc.end();
      } catch (syncErr) {
        reject(syncErr);
      }
    });

    console.log("✅ PDF généré :", filename);

    const admin_id = req.user?.id || null;

    const result = await query(
      `INSERT INTO rapports (titre, type, periode_debut, periode_fin, residence_id, admin_id, fichier, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [titre, type || "financier", periode_debut, periode_fin, residence_id || null, admin_id, filename]
    );

    console.log("✅ Rapport inséré en base, id =", result.insertId);
    res.status(201).json({ id: result.insertId, message: "Rapport généré" });
  } catch (err) {
    console.error("🔴 Erreur génération rapport:", err);
    res.status(500).json({ error: err.message || "Erreur lors de la génération du rapport" });
  }
});
router.get("/utilisateurs", async (req, res) => {
  try {
    const [{ total }] = await query("SELECT COUNT(*) AS total FROM utilisateur");
    const utilisateurs = await query("SELECT id, nom, email FROM utilisateur ORDER BY nom ASC");
    res.json({ stats: { total }, utilisateurs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des utilisateurs" });
  }
});
 
// GET /utilisateurs/:id → un seul utilisateur (sans le mot de passe)
router.get("/utilisateurs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const results = await query("SELECT id, nom, email FROM utilisateur WHERE id = ?", [id]);
    if (results.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement de l'utilisateur" });
  }
});
 
// POST /utilisateurs → créer un utilisateur
router.post("/utilisateurs", async (req, res) => {
  const { nom, email, passwd } = req.body;
 
  if (!nom || !email || !passwd) {
    return res.status(400).json({ error: "Nom, email et mot de passe requis" });
  }
 
  try {
    const hashedPasswd = await bcrypt.hash(passwd, 10);
    const result = await query("INSERT INTO utilisateur (nom, email, passwd) VALUES (?, ?, ?)", [
      nom,
      email,
      hashedPasswd,
    ]);
    res.status(201).json({ id: result.insertId, message: "Utilisateur créé" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }
    res.status(500).json({ error: "Erreur lors de la création de l'utilisateur" });
  }
});
 
// PUT /utilisateurs/:id → modifier un utilisateur
// Le mot de passe n'est mis à jour que s'il est fourni (laisser vide = inchangé)
router.put("/utilisateurs/:id", async (req, res) => {
  const { id } = req.params;
  const { nom, email, passwd } = req.body;
 
  if (!nom || !email) {
    return res.status(400).json({ error: "Nom et email requis" });
  }
 
  try {
    const rows = await query("SELECT id FROM utilisateur WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
 
    if (passwd) {
      const hashedPasswd = await bcrypt.hash(passwd, 10);
      await query("UPDATE utilisateur SET nom = ?, email = ?, passwd = ? WHERE id = ?", [nom, email, hashedPasswd, id]);
    } else {
      await query("UPDATE utilisateur SET nom = ?, email = ? WHERE id = ?", [nom, email, id]);
    }
 
    res.json({ message: "Utilisateur mis à jour" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
  }
});
 
// DELETE /utilisateurs/:id → supprimer un utilisateur
// ⚠️ si cet utilisateur est lié à un copropriétaire (utilisateur_id dans `coproprietaires`),
// la suppression échouera à cause de la contrainte de clé étrangère — c'est voulu, pour éviter
// de casser les données liées. Supprime d'abord le copropriétaire concerné si besoin.
router.delete("/utilisateurs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("DELETE FROM utilisateur WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_ROW_IS_REFERENCED_2" || err.code === "ER_ROW_IS_REFERENCED") {
      return res.status(409).json({ error: "Impossible de supprimer : cet utilisateur est lié à d'autres données (copropriétaire, annonce...)" });
    }
    res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
  }
});
 
module.exports = router;