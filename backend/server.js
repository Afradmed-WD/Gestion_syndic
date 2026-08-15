const express = require("express");
const cors = require("cors");

const EtudiantisRouter = require("./Routes/Etudians");
const DashboardRouter = require("./Routes/Dashboard");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/dashboard", DashboardRouter);
app.use("/", EtudiantisRouter);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
