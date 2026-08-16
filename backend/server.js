const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const EtudiantisRouter = require("./Routes/Etudians");
app.use("/", EtudiantisRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});