const db = require('../config/db');
const Doctor = require('../models/doctor.model');

const ALL_SLOTS = [
  "09:00","10:00","11:00","12:00","13:00","14:00",
  "15:00","16:00","17:00","18:00","19:00","20:00","21:00"
];

// ── CRUD ──────────────────────────────────────────────────────────────────────

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
    { name, specialization, experience, location, clinic, fee, image,
      available: available === 'true' ? 1 : 0 },
    (err) => {
      if (err) { console.error(err); return res.status(500).send("Error adding doctor"); }
      res.send("Doctor added successfully");
    }
  );
};

const deleteDoctor = (req, res) => {
  Doctor.deleteDoctor(req.params.id, (err) => {
    if (err) return res.status(500).send("Error deleting doctor");
    res.send("Doctor deleted");
  });
};

const updateDoctor = (req, res) => {
  const id = Number(req.params.id);
  const { name, specialization, experience, location, clinic, fee, available } = req.body;
  const getImage = (cb) => {
    if (req.file) return cb(`/uploads/doctors/${req.file.filename}`);
    db.query('SELECT image FROM doctors WHERE id = ?', [id], (err, rows) => {
      cb(err ? null : rows[0]?.image);
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

// ── Stats ─────────────────────────────────────────────────────────────────────

const getStats = (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const stats = {};

  db.query("SELECT COUNT(*) AS n FROM doctors WHERE available = 1", (err, r1) => {
    if (err) return res.status(500).send("Error");
    stats.doctors = r1[0].n;

    db.query("SELECT COUNT(*) AS n FROM appointments", (err, r2) => {
      if (err) return res.status(500).send("Error");
      stats.appointments = r2[0].n;

      db.query(
        "SELECT COUNT(*) AS n FROM appointments WHERE DATE(date) = ?",
        [targetDate],
        (err, r3) => {
          if (err) return res.status(500).send("Error");
          stats.today = r3[0].n;
          stats.selectedDate = targetDate;
          res.json(stats);
        }
      );
    });
  });
};

// ── GET /slots/:doctorId?date=YYYY-MM-DD ──────────────────────────────────────

const getSlots = (req, res) => {
  const doctor_id = req.params.doctorId;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'date query parameter is required. Usage: /slots/:id?date=YYYY-MM-DD' });
  }

  Doctor.getDoctorAvailabilityForDate(doctor_id, date, (err, availRow) => {
    if (err) {
      console.error("getSlots: getDoctorAvailabilityForDate error:", err);
      return res.status(500).json({ error: err.message });
    }

    const dateBlocked = availRow !== null && Number(availRow.is_available) === 0;

    if (dateBlocked) {
      const blocked = ALL_SLOTS.map(time => ({ time, available: 0 }));
      return res.json({ doctorAvailableOnDate: false, slots: blocked });
    }

    Doctor.getSlotsByDoctorAndDate(doctor_id, date, (err, rows) => {
      if (err) {
        console.error("getSlots: getSlotsByDoctorAndDate error:", err);
        return res.status(500).json({ error: err.message });
      }

      const dbMap = {};
      (rows || []).forEach(row => { dbMap[row.time] = Number(row.available); });

      const fullSlots = ALL_SLOTS.map(time => ({
        time,
        available: dbMap[time] !== undefined ? dbMap[time] : 0
      }));

      let doctorAvailableOnDate = null;
      if (availRow !== null) {
        doctorAvailableOnDate = Number(availRow.is_available) === 1;
      }

      res.json({ doctorAvailableOnDate, slots: fullSlots });
    });
  });
};

// ── POST /slots — batch save slots for a doctor+date ─────────────────────────

const saveSlots = (req, res) => {
  const { doctor_id, date, slots } = req.body;

  if (!doctor_id || !date || !Array.isArray(slots)) {
    return res.status(400).json({ error: 'doctor_id, date, and slots[] are required' });
  }

  if (slots.length === 0) {
    return res.json({ success: true, message: 'No slots to update' });
  }

  Doctor.upsertSlots(doctor_id, date, slots, (err) => {
    if (err) {
      console.error("saveSlots error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, doctor_id, date, count: slots.length });
  });
};

// ── POST /doctors/:id/availability ───────────────────────────────────────────

const setDoctorDateAvailability = (req, res) => {
  const doctor_id = req.params.id;
  const { date, is_available } = req.body;

  if (!date || is_available === undefined) {
    return res.status(400).json({ error: 'date and is_available are required' });
  }

  Doctor.setDoctorAvailabilityForDate(doctor_id, date, is_available, (err) => {
    if (err) {
      console.error("setDoctorDateAvailability error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (!is_available) {
      const disabledSlots = ALL_SLOTS.map(time => ({ time, available: 0 }));
      Doctor.upsertSlots(doctor_id, date, disabledSlots, (err2) => {
        if (err2) console.error("setDoctorDateAvailability: upsertSlots error:", err2);
        res.json({ success: true, doctor_id, date, is_available: false });
      });
    } else {
      res.json({ success: true, doctor_id, date, is_available: true });
    }
  });
};

// ── GET /doctors/:id/availability?date=YYYY-MM-DD ────────────────────────────

const getDoctorDateAvailability = (req, res) => {
  const doctor_id = req.params.id;
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date is required' });

  Doctor.getDoctorAvailabilityForDate(doctor_id, date, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row === null) {
      db.query('SELECT available FROM doctors WHERE id = ?', [doctor_id], (err2, rows) => {
        if (err2 || !rows.length) return res.json({ is_available: false, source: 'global' });
        res.json({ is_available: Number(rows[0].available) === 1, source: 'global' });
      });
    } else {
      res.json({ is_available: Number(row.is_available) === 1, source: 'date_override' });
    }
  });
};

module.exports = {
  getDoctors, addDoctor, deleteDoctor, updateDoctor,
  getStats,
  getSlots, saveSlots,
  setDoctorDateAvailability, getDoctorDateAvailability
};