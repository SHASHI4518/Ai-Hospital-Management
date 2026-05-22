const express = require("express");
const router = express.Router();
const ac = require("../controllers/appointment.controller");

router.post("/book", ac.bookAppointment);
router.get("/appointments/:mobile", ac.getAppointments);

// Cancel = status update (PUT) — does NOT delete
router.put("/appointments/:id/cancel", ac.cancelAppointment);
router.put("/appointments/:id", ac.cancelAppointment);

// Hard delete
router.delete("/appointments/:id", ac.deleteAppointment);

// Admin: all appointments
router.get('/admin/appointments', ac.getAllAppointments);

module.exports = router;