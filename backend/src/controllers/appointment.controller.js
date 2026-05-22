const db = require('../config/db');
const Appointment = require("../models/appointment.model");

const bookAppointment = (req, res) => {
  const { user_mobile, doctor_id, date, time } = req.body;
  if (!user_mobile || !doctor_id || !date || !time)
    return res.send("All fields required");

  Appointment.checkSlotCount(doctor_id, date, time, (err, result) => {
    if (err) { console.log(err); return res.send("Error checking slot"); }
    if (result[0].count >= 5) return res.send("Slot Full");

    Appointment.createAppointment({ user_mobile, doctor_id, date, time }, (err) => {
      if (err) { console.log(err); return res.send("Error booking appointment"); }
      res.send("Appointment booked successfully");
    });
  });
};

const getAppointments = (req, res) => {
  Appointment.getAppointmentsByUser(req.params.mobile, (err, results) => {
    if (err) return res.send("Error fetching appointments");
    res.json(results);
  });
};

// Cancel = UPDATE status to 'cancelled' — NOT a delete
const cancelAppointment = (req, res) => {
  Appointment.cancelAppointment(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: "Error cancelling" });
    res.json({ status: "cancelled", id: req.params.id });
  });
};

const deleteAppointment = (req, res) => {
  Appointment.deleteAppointment(req.params.id, (err) => {
    if (err) return res.send("Error deleting");
    res.send("Deleted permanently");
  });
};

const getAllAppointments = (req, res) => {
  const sql = `
    SELECT a.*, d.name AS doctor_name
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    ORDER BY a.date DESC
  `;
  db.query(sql, (err, results) => {
    if (err) { console.log(err); return res.status(500).send("Error"); }
    res.json(results);
  });
};

module.exports = {
  bookAppointment, getAppointments, cancelAppointment,
  deleteAppointment, getAllAppointments
};