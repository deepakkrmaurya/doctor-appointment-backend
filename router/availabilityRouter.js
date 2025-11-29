import express from 'express';
import { 
    addAvailability, 
    addAvailabilityWithDateCheck, 
    updateAvailability, 
    getAvailabilityByDoctor 
} from '../controller/AvailabilityController.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Add new availability (checks if doctor already has any availability)
router.post('/availability', authenticate, authorize(['doctor']) ,addAvailability);

// Add new availability with date-level checking
router.post('/availability/check-dates', authenticate, authorize(['doctor']) ,addAvailabilityWithDateCheck);

// Update existing availability
router.put('/availability', authenticate, authorize(['doctor']) ,updateAvailability);

// Get availability by doctor ID
router.get('/availability/:doctor_id', authenticate, authorize(['doctor']) ,getAvailabilityByDoctor);

export default router;