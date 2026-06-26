const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

/**
 * 
 * @name registerUserController
 * @description register a new user, expecs username,email and password in the request
 * @access Public
 */
async function registerUserController(req,res){

    const{username,email,password} = req.body

if(!username || !email || !password){
    return res.status(400).json({
        message:"Please provide username,email and password"
    })
}
  const isUserAlreadyExist = await userModel.findOne({
    $or: [{ username }, { email }]
  })

  if(isUserAlreadyExist){
    // isUserAlreadyExists.username == username
    return res.status(400).json({
        message:"User already exist with this username or email address"
    })
  }
 
const hash = await bcrypt.hash(password,10)

const user = await userModel.create({
    username,
    email,
    password:hash
})

const token = jwt.sign(
    { id: user._id,username: user.username },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
)
    res.cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000,
        path: "/"
    })

    res.status(201).json({
    message:"User registered successfully",
    user:{
        id:user._id,
        username:user.username,
        email:user.email
    }
})

}


/**
 * @name loginUserController
 * @description login a user,expects email and password in the request body
 * @access public
 */
async function loginUserController(req,res){

    const{email,password} = req.body

    const user = await userModel.findOne({email})

    if(!user){
        return res.status(404).json({
            message:"Invalid email or password"
        })

    }

    const isPasswordValid = await bcrypt.compare(password,user.password)

    if(!isPasswordValid){
        return res.status(404).json({
            message:"Invalid email or password"
        })

    }
const token = jwt.sign(
    { id: user._id,username: user.username },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
)
    res.cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000,
        path: "/"
    })
    res.status(200).json({
        message:"User logged in successfully",
        token: token,
    user:{
        id:user._id,
        username:user.username,
        email:user.email
    }
    })
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */

async function logoutUserController(req,res){

    // Get token from cookies, Authorization header, or request body
    const token = req.cookies.token || 
                  req.headers.authorization?.split(" ")[1] || 
                  req.body?.token

    if(!token){
        return res.status(400).json({
            message:"No token found"
        })
    }

    try {
        const savedToken = await tokenBlacklistModel.create({token})
        console.log("Token saved to blacklist:", savedToken)
        res.clearCookie("token")
        res.status(200).json({
            message:"User logged out successfully"
        })
    } catch(error){
        console.error("Logout error:", error)
        res.status(500).json({
            message:"Error during logout",
            error: error.message
        })
    }
}
/**
 * @name getMeController
 * @description get the current logged in user details
 * @access private
 */

async function getMeController(req,res) {
    const user = await userModel.findById(req.user.id)
    res.status(200).json({
        message:"User details fetched successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController


}