import { Router } from "express";
import { deleteStaff, getStaff, Login, StaffRegister } from "../controller/staff.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
const route=Router();

route.post('/register',authenticate ,authorize(["admin",'hospital']),StaffRegister)
route.get('/',authenticate ,authorize(["admin",'hospital']),getStaff)
route.delete('/delete/:id',authenticate ,authorize(["admin",'hospital']),deleteStaff)
route.post('/login',Login)

export default route