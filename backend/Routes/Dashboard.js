const express = require("express");
const connection = require("../db");

const router = express.Router();

const db = connection.promise();

router.get("/stats", async (_req, res) => {
  try {
    const [[residences]] = await db.query("SELECT COUNT(*) AS total FROM residences");
    const [[appartements]] = await db.query("SELECT COUNT(*) AS total FROM appartements");
    const [[coproprietaires]] = await db.query("SELECT COUNT(*) AS total FROM coproprietaires");
    const [[reclamations]] = await db.query(
      "SELECT COUNT(*) AS total FROM reclamations WHERE statut <> 'resolue'"
    );
    const [[charges]] = await db.query(
      "SELECT COALESCE(SUM(montant), 0) AS total FROM charges WHERE statut <> 'payee'"
    );
    const [[paiements]] = await db.query(
      `SELECT COALESCE(SUM(montant_paye), 0) AS total FROM paiements
       WHERE MONTH(date_paiement) = MONTH(CURDATE()) AND YEAR(date_paiement) = YEAR(CURDATE())`
    );

    res.json({
      residences: residences.total,
      appartements: appartements.total,
      coproprietaires: coproprietaires.total,
      reclamationsOuvertes: reclamations.total,
      chargesImpayees: Number(charges.total),
      paiementsDuMois: Number(paiements.total),
    });
  } catch (err) {
    res.status(500).json({ error: "Impossible de charger les statistiques", details: err.message });
  }
});

router.get("/paiements-recents", async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.montant_paye, p.date_paiement, p.mode_paiement, p.reference,
              a.numero AS appartement, c.libelle AS charge
       FROM paiements p
       LEFT JOIN appartements a ON a.id = p.appartement_id
       LEFT JOIN charges c ON c.id = p.charge_id
       ORDER BY p.date_paiement DESC, p.id DESC
       LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Impossible de charger les paiements", details: err.message });
  }
});

router.get("/reclamations-recentes", async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.sujet, r.statut, r.date_reclamation, a.numero AS appartement
       FROM reclamations r
       LEFT JOIN appartements a ON a.id = r.appartement_id
       ORDER BY r.date_reclamation DESC, r.id DESC
       LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Impossible de charger les réclamations", details: err.message });
  }
});

module.exports = router;
