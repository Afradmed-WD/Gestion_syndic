const mysql=require("mysql2")

const connection=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"management_syndic"
})

module.exports=connection