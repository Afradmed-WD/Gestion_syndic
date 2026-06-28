
const express = require("express");
const bcrypt = require("bcryptjs"); // pour comparer les mots de passe hachés
const jwt = require("jsonwebtoken");
const connection = require("../db");
const router = express.Router();

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

      res.json({ message: "Connexion réussie", user: results[0] });
    }
  );
});



// Route avec paramètre
router.get("/etudiant/:id", (req, res) => {
  const id = req.params.id;
  res.send(`ID de l'étudiant : ${id}`);
});

router.get("/admin", (req, res) => {
  connection.query("SELECT * FROM utilisateur", (_, results) => {
    
    res.json(results);
  });
});


module.exports = router;
