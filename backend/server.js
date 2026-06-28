const express=require("express")
const app=express()
const cors = require("cors");
app.use(cors());
app.use(express.json());

const EtudiantisRouter=require("./Routes/Etudians")
app.get("/etudiant/:id",EtudiantisRouter)
app.use("/", EtudiantisRouter);

app.listen(3000)