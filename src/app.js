const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express() // create a instance of server

app.use(express.json()) // create midware or use routes
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
/* requre all the routes here */
const authRouter = require("./routes/auth.routes") // if issue then ./routes/auth.routes
const interviewRouter = require("./routes/interview.routes")


// using all the routes here
app.use("/api/auth",authRouter)
app.use("/api/interview",interviewRouter)




module.exports = app