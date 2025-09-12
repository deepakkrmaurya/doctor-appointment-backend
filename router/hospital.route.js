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
  updateStatusByHospitalId,
} from "../controller/hospital.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.js";

// Create a new hospital (Admin access)
 
router.post('/login',Login)

router.post(
  "/",
  authenticate,
  authorize(["admin"]),
  upload.single('image'),
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
  upload.single('image'),
  updateHospital
);
router.put(
  "/:id/status",
  authenticate,
  authorize(["admin"]),
  updateStatus
);
router.patch(
  "/:id/status",
  authenticate,
  authorize(["admin",'hospital']),
  updateStatusByHospitalId
);
// Delete hospital (Admin access)
router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  deleteHospital
);


export default router;