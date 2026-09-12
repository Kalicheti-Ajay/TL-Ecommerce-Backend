const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/users");

function publicUser(user) { 
  return { 
    id:user._id,
    name:user.name,
    email:user.email, 
    role:user.role, 
    createdAt:user.createdAt 
  }; 
}

async function register(req,res,next) {
  try {
    const {name,email,password,role = "user"} = req.body;
    if (!name || !email || !password) 
    {
      return res.status(400).json({ message:"name,email, and password are required." });
    }
    if (String(password).length<6)
    {
       return res.status(400).json({message:"password must contain at least 6 characters."});
    }
    if (!["user","admin"].includes(role))
    {
    return res.status(400).json({message:"role must be user or admin."});
    }
    if (await User.exists({email: String(email).toLowerCase()}))
    {
       return res.status(409).json({message: "An account with this email already exists."});
    }
    const user = await User.create({name,email,role,password:await bcrypt.hash(password, 12)});
    return res.status(201).json({message:"User registered.",user: publicUser(user)});
  } 
  catch (error) 
  {
     return next(error); 
  }
}

async function login(req,res,next) {
  try {
    const {email,password} = req.body;
    if (!email || !password) 
    {
      return res.status(400).json({message:"email and password are required to be logged in."});
    }
    const user = await User.findOne({email: String(email).toLowerCase()}).select("+password");
    if (!user || !(await bcrypt.compare(password,user.password))) 
    {
      return res.status(401).json({message:"Invalid email or password."});
    }
    const token = jwt.sign({userId:user._id, role:user.role}, process.env.JWT_SECRET, {expiresIn:"1d"});
    return res.json({message:"Login successful.",token,user: publicUser(user)});
  } 
  catch(error) 
  { 
    return next(error); 
  }
}

async function listUsers(req,res,next) {
  try 
  { 
    return res.json({users:(await User.find().sort({createdAt: -1})).map(publicUser)}); 
  }
  catch (error) 
  { 
    return next(error); 
  }
}

async function updateUserRole(req,res,next) {
  try 
  {
    if (!mongoose.isValidObjectId(req.params.id)) 
    {
        return res.status(400).json({message:"Invalid user id."});
    }
    if (!["user","admin"].includes(req.body.role)) 
    {
      return res.status(400).json({message:"role must be user or admin."});
    }
    const user = await User.findByIdAndUpdate(req.params.id,{role:req.body.role},{new:true,runValidators:true});
    if (!user) 
    {
      return res.status(404).json({message:"User not found."});
    }
    return res.json({message:"User role updated.",user:publicUser(user)});
  } 
  catch(error) 
  { 
    return next(error); 
  }
}

module.exports = 
{
  register, 
  login, 
  listUsers, 
  updateUserRole 
};
