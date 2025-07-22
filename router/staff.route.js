import { Router } from "express";
import { getStaff, Login, StaffRegister } from "../controller/staff.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
const route=Router();

route.post('/register',authenticate ,authorize(["admin",'hospital']),StaffRegister)
route.get('/',authenticate ,authorize(["admin",'hospital']),getStaff)
route.post('/login',Login)

export default route