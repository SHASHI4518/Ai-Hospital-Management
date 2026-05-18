const db = require('../config/db');
const Doctor = require('../models/doctor.model');


// Get all doctors
const getDoctors = (req, res) => {
  Doctor.getAllDoctors((err, results) => {
    if (err) return res.status(500).json({ error: 'Error fetching doctors' });
    res.json(results);
  });
};

// Add new doctor
const addDoctor = (req, res) => {
  const { name, specialization, experience, location, clinic, fee, available } = req.body;

  if (!name || !specialization) {
    if (req.file) require('fs').unlinkSync(req.file.path); // clean up orphaned file
    return res.status(400).send("Name and specialization required");
  }

  // If a file was uploaded, store its relative path. Otherwise null.
  const image = req.file
    ? `/uploads/doctors/${req.file.filename}`
    : null;

  Doctor.addDoctor(
    { name, specialization, experience, location, clinic, fee, image, available: available === 'true' ? 1 : 0  },
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error adding doctor");
      }
      res.send("Doctor added successfully");
    }
  );
};

// Delete doctor
const deleteDoctor = (req, res) => {
  const id = req.params.id;

  Doctor.deleteDoctor(id, (err, result) => {
    if (err) return res.status(500).send("Error deleting doctor");
    res.send("Doctor deleted");
  });
};

// Update doctor

const updateDoctor = (req, res) => {
  const id = Number(req.params.id);
  const updateDoctor = (req, res) => {
  const id = Number(req.params.id);
};
  const { name, specialization, experience, location, clinic, fee, available } = req.body;

  // use new file path if uploaded, otherwise keep existing image from DB
  const getImage = (callback) => {
    if (req.file) return callback(`/uploads/doctors/${req.file.filename}`);
    // no new file — fetch existing image path from DB
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
// Stats
const getStats = (req, res) => {
  const stats = {};

  db.query("SELECT COUNT(*) AS totalDoctors FROM doctors", (err, result1) => {
    if (err) return res.status(500).send("Error");
    stats.doctors = result1[0].totalDoctors;

    db.query("SELECT COUNT(*) AS totalAppointments FROM appointments", (err, result2) => {
      if (err) return res.status(500).send("Error");
      stats.appointments = result2[0].totalAppointments;

      db.query("SELECT COUNT(*) AS today FROM appointments WHERE DATE(date)=CURDATE()", (err, result3) => {
        if (err) return res.status(500).send("Error");
        stats.today = result3[0].today;
        res.json(stats);
      });
    });
  });
};


const getSlots = (req, res) => {
  const doctor_id = req.params.id;

  const ALL_SLOTS = [
    "09:00","10:00","11:00","12:00","13:00","14:00",
    "15:00","16:00","17:00","18:00","19:00","20:00","21:00"
  ];

  const sql = `SELECT time, available FROM doctor_slots WHERE doctor_id = ?`;

  db.query(sql, [doctor_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const dbMap = {};
    results.forEach(row => {
      dbMap[row.time] = Number(row.available);
    });

    const fullSlots = ALL_SLOTS.map(time => ({
      time,
      available: dbMap[time] !== undefined ? dbMap[time] : 0
    }));

    res.json(fullSlots);
  });
};


const toggleSlot = (req, res) => {
  const { doctor_id, time, available } = req.body;

  if (doctor_id === undefined || !time || available === undefined) {
    return res.status(400).json({ error: 'doctor_id, time, and available are required' });
  }

  const availableVal = Number(available); 

  const sql = `
    INSERT INTO doctor_slots (doctor_id, time, available)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE available = VALUES(available)
  `;

  db.query(sql, [doctor_id, time, availableVal], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      success: true,
      doctor_id,
      time,
      available: availableVal
    });
  });
};

// Add slot 
const addSlot = (req, res) => {
  const { doctor_id, time } = req.body;

  Doctor.addSlot(doctor_id, time, (err) => {
    if (err) return res.status(500).send("Error adding slot");
    res.send("Slot added");
  });
};

// Delete slot
const deleteSlot = (req, res) => {
  const id = req.params.id;

  Doctor.deleteSlot(id, (err) => {
    if (err) return res.status(500).send("Error deleting");
    res.send("Deleted");
  });
};

module.exports = {
  getDoctors,
  addDoctor,
  deleteDoctor,
  updateDoctor,
  getStats,
  addSlot,
  getSlots,
  deleteSlot,
  toggleSlot
};