const express=require("express")
const router=express.Router()
router.get('/',(req,res)=>{
    res.send("liste des etudiant")
})
router.get("/etudiant/:id",(req,res)=>{
    const id=req.params.id
    res.send(`ID de Etudiant : ${id}`)
})
module.exports=router;