import jwt from "jsonwebtoken";
import User from "../model/user.model.js";
import doctorNodel from "../model/doctor.nodel.js";
import hospitalModel from "../model/hospital.model.js";
import Staff from "../model/staff.model.js";
import Admin from "../model/admin.js";
export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'invali Token'
      })
    } 
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    
    let user = await User.findById(decoded.id).select("-password");
    if (!user) {
      user = await doctorNodel.findById(decoded.id).select("-password");

    }
    if (!user) {
      user = await hospitalModel.findById(decoded.id).select("-password");
    }

    if (!user) {
      user = await Staff.findById(decoded.id).select("-password");
    }
    if (!user) {
      user = await Admin.findById(decoded.id).select("-password");
    }
    // console.log(user)
    req.user = user;
    next();

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
};

// Authorization middleware
export const authorize = (roles) => {
  return (req, res, next) => {
    // console.log("ss", req.user)
    // console.log(roles)
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized for this route" });
    }
    next();
  };
};