import express from 'express';
import { getUserDashboardData } from '../controller/userDashboardController.js';
import { authenticate } from '../middleware/auth.middleware.js';


const router = express.Router();

// Get user dashboard data
router.get('/',authenticate, getUserDashboardData);

// Get user appointments with filters
// router.get('/appointments', getUserAppointments);

export default router;