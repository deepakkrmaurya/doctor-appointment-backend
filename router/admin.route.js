import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { Login } from "../controller/admin.controller.js";
const route=Router();

route.post('/login',Login)


export default route