import express from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getAvailableSlots,
  updatePaymentStatus,
  getToDayAppointment,
  getAppointmentBydoctorIdAndHospitalIdAndAdminId,
  verifyPayment,
} from "../controller/appointment.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new appointment (Patient access)
router.post(
  "/",
  authenticate,
  authorize(["patient", "admin",'hospital','doctor']),
  createAppointment
);
router.post('/verify',authenticate,verifyPayment);
// Get all appointments (Role-based access)
router.get("/",
  authenticate,
  getAppointments
);

router.get("/today", authenticate, authorize(['admin', 'hospital', 'doctor','staff']), getToDayAppointment);
// Get single appointment by ID (Role-based access)
router.get("/:id",
  authenticate,
  getAppointmentById);

// Update appointment status (Doctor/Hospital Admin/Patient access)
router.patch(
  "/:id/status",
  authenticate,
  authorize(["doctor", "hospital", "patient", "admin"]),
  updateAppointmentStatus
);

// Cancel an appointment (Patient/Admin access)
router.patch(
  "/:id/cancel",
  authenticate,
  authorize(["patient", "admin", 'hospital', 'doctor']),
  cancelAppointment
);


// Get available slots for a doctor on specific date (Public or authenticated)
router.get("/slots/:doctorId/:date", getAvailableSlots);

// Update payment status (Admin/Payment system access)
router.patch(
  "/:id/payment",
  authenticate,
  authorize(["admin"]),
  updatePaymentStatus
);

router.get('/appointment',
  authenticate,
  authorize(["admin", "doctor", 'hospital'], getAppointmentBydoctorIdAndHospitalIdAndAdminId),
)
export default router;