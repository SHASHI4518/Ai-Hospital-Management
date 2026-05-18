const db = require('../config/db');
const Appointment = require("../models/appointment.model");

//  Book appointment
const bookAppointment = (req, res) => {
  const { user_mobile, doctor_id, date, time } = req.body;

  if (!user_mobile || !doctor_id || !date || !time) {
    return res.send("All fields required");
  }

  // Check slot
  Appointment.checkSlotCount(doctor_id, date, time, (err, result) => {

    if (err) {
      console.log(err);
      return res.send("Error checking slot");
    }

    const count = result[0].count;

    if (count >= 5) {
      return res.send("Slot Full");
    }

    const data = { user_mobile, doctor_id, date, time };

    //  Call model
    Appointment.createAppointment(data, (err, result) => {
      if (err) {
        console.log(err);
        return res.send("Error booking appointment");
      }

      res.send("Appointment booked successfully");
    });
  });
};

// Get user appointments
const getAppointments = (req, res) => {
  const mobile = req.params.mobile;

  Appointment.getAppointmentsByUser(mobile, (err, results) => {
    if (err) return res.send("Error fetching appointments");
    res.json(results);
  });
};

// Cancel
const cancelAppointment = (req, res) => {
  const id = req.params.id;

  Appointment.cancelAppointment(id, (err) => {
    if (err) return res.send("Error cancelling appointment");
    res.json({ status: "cancelled" });
  });
};

// Slot API
const getSlots = (req, res) => {
  const { doctor_id, date } = req.query;

  Appointment.getSlotCounts(doctor_id, date, (err, results) => {
    if (err) return res.send("Error fetching slots");
    res.json(results);
  });
};

// Delete
const deleteAppointment = (req, res) => {
  const id = req.params.id;

  Appointment.deleteAppointment(id, (err) => {
    if (err) return res.send("Error deleting appointment");
    res.send("Appointment deleted permanently");
  });
};

//  Admin: Get all appointments
const getAllAppointments = (req, res) => {

  const sql = `
    SELECT a.*, d.name AS doctor_name
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    ORDER BY a.date DESC
  `;

  db.query(sql, (err, results) => {

    if (err) {
      console.log(err);
      return res.status(500).send("Error fetching appointments");
    }

    res.json(results);
  });
};

module.exports = {
  bookAppointment,
  getAppointments,
  cancelAppointment,
  getSlots,
  deleteAppointment,
  getAllAppointments
};