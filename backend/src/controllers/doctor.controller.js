const db = require('../config/db');
const Doctor = require('../models/doctor.model');

const getDoctors = (req, res) => {
  Doctor.getAllDoctors((err, results) => {
    if (err) return res.status(500).json({ error: 'Error fetching doctors' });
    res.json(results);
  });
};

const addDoctor = (req, res) => {
  const { name, specialization, experience, location, clinic, fee, available } = req.body;

  if (!name || !specialization) {
    if (req.file) require('fs').unlinkSync(req.file.path);
    return res.status(400).send("Name and specialization required");
  }

  const image = req.file ? `/uploads/doctors/${req.file.filename}` : null;

  Doctor.addDoctor(
    { name, specialization, experience, location, clinic, fee, image, available: available === 'true' ? 1 : 0 },
    { name, specialization, experience, location, clinic, fee, image, available: available === 'true' ? 1 : 0 },
    (err, result) => {
      if (err) { console.error(err); return res.status(500).send("Error adding doctor"); }
      res.send("Doctor added successfully");
    }
  );
};

const deleteDoctor = (req, res) => {
  const id = req.params.id;
  Doctor.deleteDoctor(id, (err, result) => {
    if (err) return res.status(500).send("Error deleting doctor");
    res.send("Doctor deleted");
  });
};

const updateDoctor = (req, res) => {
  const id = Number(req.params.id);
  const { name, specialization, experience, location, clinic, fee, available } = req.body;

  const getImage = (callback) => {
    if (req.file) return callback(`/uploads/doctors/${req.file.filename}`);
    db.query('SELECT image FROM doctors WHERE id = ?', [id], (err, rows) => {
      callback(err ? null : rows[0]?.image);
    });
  };

  getImage((image) => {
    Doctor.updateDoctor(
      id,
      { name, specialization, experience, location, clinic, fee, image,
        available: available === 'true' || available === '1' ? 1 : 0 },
      (err) => {
        if (err) { console.error(err); return res.status(500).send("Error updating doctor"); }
        res.send("Doctor updated successfully");
      }
    );
  });
};

const getStats = (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const stats = {};

  db.query("SELECT COUNT(*) AS totalDoctors FROM doctors WHERE available = 1", (err, result1) => {
    if (err) return res.status(500).send("Error");
    stats.doctors = result1[0].totalDoctors;

    db.query("SELECT COUNT(*) AS totalAppointments FROM appointments", (err, result2) => {
      if (err) return res.status(500).send("Error");
      stats.appointments = result2[0].totalAppointments;

      db.query(
        "SELECT COUNT(*) AS dayCount FROM appointments WHERE DATE(date) = ?",
        [targetDate],
        (err, result3) => {
          if (err) return res.status(500).send("Error");
          stats.today = result3[0].dayCount;
          stats.selectedDate = targetDate;
          res.json(stats);
        }
      );
    });
  });
};

const getSlots = (req, res) => {
  const doctor_id = req.params.id;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required' });
  }

  const ALL_SLOTS = [
    "09:00","10:00","11:00","12:00","13:00","14:00",
    "15:00","16:00","17:00","18:00","19:00","20:00","21:00"
  ];

  const sql = `SELECT time, available FROM doctor_slots WHERE doctor_id = ? AND date = ?`;

  db.query(sql, [doctor_id, date], (err, results) => {
    if (err) {
      console.error("SQL Error in getSlots:", err);
      return res.status(500).json({ error: err.message });
    }

    const dbMap = {};
    if (results && Array.isArray(results)) {
      results.forEach(row => { dbMap[row.time] = Number(row.available); });
    }

    const fullSlots = ALL_SLOTS.map(time => ({
      time,
      available: dbMap[time] !== undefined ? dbMap[time] : 0
    }));

    res.json(fullSlots);
  });
};

const toggleSlot = (req, res) => {
  const { doctor_id, date, slots } = req.body;

  if (doctor_id === undefined || !date || !slots || !Array.isArray(slots)) {
    return res.status(400).json({ error: 'doctor_id, date, and slots array are required' });
  }

  if (slots.length === 0) {
    return res.json({ success: true, message: "No slots provided to update" });
  }

  const values = slots.map(slot => [doctor_id, date, slot.time, Number(slot.available)]);
  const sql = `
    INSERT INTO doctor_slots (doctor_id, date, time, available)
    VALUES ?
    ON DUPLICATE KEY UPDATE available = VALUES(available)
  `;

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error("SQL Error in toggleSlot batch update:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, doctor_id, date, updatedCount: slots.length });
  });
};

const addSlot = (req, res) => {
  const { doctor_id, time } = req.body;
  Doctor.addSlot(doctor_id, time, (err) => {
    if (err) return res.status(500).send("Error adding slot");
    res.send("Slot added");
  });
};

const deleteSlot = (req, res) => {
  const id = req.params.id;
  Doctor.deleteSlot(id, (err) => {
    if (err) return res.status(500).send("Error deleting");
    res.send("Deleted");
  });
};

module.exports = {
  getDoctors, addDoctor, deleteDoctor, updateDoctor,
  getStats, addSlot, getSlots, deleteSlot, toggleSlot
};