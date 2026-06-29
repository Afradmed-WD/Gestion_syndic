
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
router.post("/register",async(req,res)=>{
  const {nom,email,passwd}=req.body
  connection.query(
    "INSERT INTO utilisateur (nom,email,passwd) VALUES(?,?,?)",[nom,email,passwd],(err,result)=>{
      if(err) return res.status(500).json(err)

      const token=jwt.sign({nom,email,passwd},"SECRET_KEY", { expiresIn: "1h" })
       res.json({ token });
    }
  )
})


router.get("/admin", (req, res) => {
  connection.query("SELECT * FROM utilisateur", (_, results) => {
    
    res.json(results);
  });
});


module.exports = router;
