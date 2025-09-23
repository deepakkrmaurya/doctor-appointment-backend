import { Router } from "express";
import { ActiveDoctor, addDoctorSlots, ChangePassword, createDoctor, deleteDoctor, getDoctorByHospitalId, getDoctorById, getDoctors, getDoctorSlotsByDate, Login, removeDoctorSlots, updateDoctor, updateStatusByDoctorId } from "../controller/doctor.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.js";
const router = Router();
router.post('/login',Login)
router.post("/", authenticate, authorize(["admin",'hospital']), upload.single('photo'), createDoctor);
router.get("/", getDoctors);
router.put("/change/password",authenticate ,ChangePassword);
router.get("/:id",authenticate ,authorize(["admin",'hospital','doctor','staff']), getDoctorById);
router.get("/:hospitalId/hospital", getDoctorByHospitalId);
router.put("/:id", authenticate,authorize(["admin",'hospital','doctor']) ,upload.single('photo'),updateDoctor);
router.delete("/:id", authenticate,  authorize(["admin",'hospital']),deleteDoctor);
router.put("/:id/active/doctor", authenticate,  authorize(["doctor"]),ActiveDoctor);
router.post("/:id/slots", authenticate ,authorize(["admin",'hospital','doctor']) ,addDoctorSlots);
router.patch("/:id/status", authenticate ,authorize(["admin",'hospital','doctor']) ,updateStatusByDoctorId);
router.delete("/:id/slots",authenticate, authorize(["admin",'hospital','doctor']) ,removeDoctorSlots);
router.get("/:id/slots/:date", authenticate ,authorize(["admin",'hospital','doctor']) ,getDoctorSlotsByDate);

export default router;
