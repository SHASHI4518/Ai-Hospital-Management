const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controller");

router.post("/book", appointmentController.bookAppointment);
router.get("/appointments/:mobile", appointmentController.getAppointments);
router.put("/appointments/:id", appointmentController.cancelAppointment);
router.get("/slots", appointmentController.getSlots);
router.delete("/appointments/:id", appointmentController.deleteAppointment);
router.get('/admin/appointments', appointmentController.getAllAppointments);
module.exports = router;