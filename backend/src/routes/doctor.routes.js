const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const upload = require('../upload');

// Doctor CRUD
router.get('/doctors', doctorController.getDoctors);
router.post('/doctors', upload.single('image'), doctorController.addDoctor);
router.delete('/doctors/:id', doctorController.deleteDoctor);
router.put('/doctors/:id', upload.single('image'), doctorController.updateDoctor);

// Stats
router.get('/stats', doctorController.getStats);

// Time Slots  (date-aware)
router.post('/slots', doctorController.toggleSlot);          // batch save
router.get('/slots/:id', doctorController.getSlots);         // fetch for doctor + date
router.delete('/slots/:id', doctorController.deleteSlot);

// Date-wise Doctor Availability
router.post('/doctors/:id/availability', doctorController.setDoctorDateAvailability);
router.get('/doctors/:id/availability', doctorController.getDoctorDateAvailability);

module.exports = router;
