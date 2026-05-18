const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const upload = require('../upload');

router.get('/doctors', doctorController.getDoctors);
router.post('/doctors', upload.single('image'), doctorController.addDoctor);
router.delete('/doctors/:id', doctorController.deleteDoctor);
router.put('/doctors/:id', upload.single('image'), doctorController.updateDoctor);  // ← add upload here
router.get('/stats', doctorController.getStats);
router.post('/slots', doctorController.toggleSlot);
router.get('/slots/:id', doctorController.getSlots);
router.delete('/slots/:id', doctorController.deleteSlot);

module.exports = router;