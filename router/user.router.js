import { Router } from "express";
import { appointment, getUser, login, Logout, Register, updateProfile, verifyOtp } from "../controller/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const route = Router();

route.post('/login',login)
route.post('/verify/otp',verifyOtp)
route.get('/logout',Logout);
route.post('/register',Register)
route.post('/appointment',appointment)
route.put('/update',authenticate,updateProfile)
route.get('/me',authenticate,getUser)

export default route;