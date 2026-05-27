const express = require('express');
const router = express.Router();
const dc = require('../controllers/doctor.controller');
const upload = require('../upload');

// Doctor CRUD
router.get('/doctors', dc.getDoctors);
router.post('/doctors', upload.single('image'), dc.addDoctor);
router.delete('/doctors/:id', dc.deleteDoctor);
router.put('/doctors/:id', upload.single('image'), dc.updateDoctor);

// Stats (supports ?date=YYYY-MM-DD)
router.get('/stats', dc.getStats);

// ── Slot config ──────────────────────────────────────────────────────────────
// GET /slots/config  → returns dynamic list of all slot times + startHour/endHour
// NOTE: this MUST be registered BEFORE /slots/:doctorId so Express doesn't
//       treat "config" as a doctorId parameter.
router.get('/slots/config', dc.getSlotConfig);

// Slots — date-aware
// GET  /slots/:doctorId?date=YYYY-MM-DD  → fetch slots for that doctor+date
// POST /slots                            → batch save slots { doctor_id, date, slots[] }
router.get('/slots/:doctorId', dc.getSlots);
router.post('/slots', dc.saveSlots);

// Date-wise doctor availability
router.post('/doctors/:id/availability', dc.setDoctorDateAvailability);
router.get('/doctors/:id/availability', dc.getDoctorDateAvailability);

module.exports = router;