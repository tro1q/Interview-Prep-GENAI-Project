require("dotenv").config()

const app = require("./app")
const connecToDB = require("./config/database")





connecToDB()



app.listen(3000,() => {
    console.log("Server is running on port 3000")
})