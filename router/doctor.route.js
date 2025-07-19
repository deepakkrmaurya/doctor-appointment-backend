import { Router } from "express";
import { addDoctorSlots, createDoctor, deleteDoctor, getDoctorByHospitalId, getDoctorById, getDoctors, getDoctorSlotsByDate, Login, removeDoctorSlots, updateDoctor } from "../controller/doctor.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.js";
const router = Router();
router.post('/login',Login)
router.post("/", authenticate, authorize(["admin",'hospital']), upload.single('photo'), createDoctor);
router.get("/", getDoctors);
router.get("/:id",authenticate ,authorize(["admin",'hospital']), getDoctorById);
router.get("/:hospitalId/hospital", getDoctorByHospitalId);
router.put("/:id", authorize(["admin",'hospital','doctor']) ,updateDoctor);
router.delete("/:id", authenticate,  authorize(["admin",'hospital']),deleteDoctor);
router.post("/:id/slots", authorize(["admin",'hospital','doctor']) ,addDoctorSlots);
router.delete("/:id/slots", authorize(["admin",'hospital','doctor']) ,removeDoctorSlots);
router.get("/:id/slots/:date", authorize(["admin",'hospital','doctor']) ,getDoctorSlotsByDate);

export default router;
