import { Router } from "express";
const router = Router();
import {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
  Login,
  updateStatus,
} from "../controller/hospital.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

// Create a new hospital (Admin access)
 
router.post('/login',Login)

router.post(
  "/",
  authenticate,
  authorize(["admin"]),
  createHospital
);
// Get all hospitals (Public access)
router.get(
  "/",
  getHospitals
);
// Get single hospital by ID (Public access)
router.get(
  "/:id",
  getHospitalById
);
// Update hospital (Admin access)
router.put(
  "/:id",
  authenticate,
  authorize(["admin",'hospital']),
  updateHospital
);
router.put(
  "/:id/status",
  authenticate,
  authorize(["admin"]),
  updateStatus
);
// Delete hospital (Admin access)
router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  deleteHospital
);


export default router;