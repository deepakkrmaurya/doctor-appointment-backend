import { Router } from "express";
import { appointment, login, Logout, Register, verifyOtp } from "../controller/user.controller.js";

const route = Router();

route.post('/login',login)
route.post('/verify/otp',verifyOtp)
route.get('/logout',Logout);
route.post('/register',Register)
route.post('/appointment',appointment)

export default route;