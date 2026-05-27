const db = require('../config/db');
const Doctor = require('../models/doctor.model');

// ── Dynamic slot generation ───────────────────────────────────────────────────
//
// Slots are generated dynamically from SLOT_START_HOUR to SLOT_END_HOUR.
// Change these two constants to adjust the clinic's working hours globally.
// No code changes required in the frontend — the frontend fetches this list.

const SLOT_START_HOUR = 9;   // 09:00  (inclusive)
const SLOT_END_HOUR   = 21;  // 21:00  (inclusive, last slot of the day)

/**
 * Generates an array of "HH:00" strings from SLOT_START_HOUR to SLOT_END_HOUR.
 * Example output: ["09:00","10:00", ... ,"21:00"]
 */
function generateAllSlots() {
  const slots = [];
  for (let h = SLOT_START_HOUR; h <= SLOT_END_HOUR; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
  }
  return slots;
}

const ALL_SLOTS = generateAllSlots();
const MAX_BOOKINGS_PER_SLOT = 5;

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

// ── GET /slots/config ─────────────────────────────────────────────────────────
//
// Returns the full list of clinic slot times so the frontend never needs
// to hardcode them. Also exposes startHour / endHour for display purposes.

const getSlotConfig = (req, res) => {
  res.json({
    slots:     ALL_SLOTS,
    startHour: SLOT_START_HOUR,
    endHour:   SLOT_END_HOUR
  });
};

// ── GET /slots/:doctorId?date=YYYY-MM-DD ──────────────────────────────────────
//
// Returns for each time slot:
//   available    : 1 = bookable, 0 = not bookable
//   bookingCount : how many active bookings exist for that slot
//   isFull       : true when bookingCount >= MAX_BOOKINGS_PER_SLOT
//   isPast       : true when the slot time has already passed today
//
// A slot is NOT available when ANY of:
//   1. The doctor is marked unavailable on this date (date_override or global flag)
//   2. The admin has set doctor_slots.available = 0 for this slot
//   3. The slot already has MAX_BOOKINGS_PER_SLOT active bookings
//   4. The slot time is in the past (date == today && slot hour <= current hour)

const getSlots = (req, res) => {
  const doctor_id = req.params.doctorId;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      error: 'date query parameter is required. Usage: /slots/:id?date=YYYY-MM-DD'
    });
  }

  // Determine which slots are "in the past" for today's date.
  // We use the server's local time so the check is consistent regardless of client timezone.
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday  = date === todayStr;
  const nowHour  = new Date().getHours(); // 0-23 in server local time

  // Step 1: check date-level availability
  Doctor.getDoctorAvailabilityForDate(doctor_id, date, (err, availRow) => {
    if (err) {
      console.error("getSlots: getDoctorAvailabilityForDate error:", err);
      return res.status(500).json({ error: err.message });
    }

    const dateBlocked = availRow !== null && Number(availRow.is_available) === 0;

    if (dateBlocked) {
      const blocked = ALL_SLOTS.map(time => {
        const slotHour = parseInt(time.split(':')[0], 10);
        const isPast   = isToday && slotHour <= nowHour;
        return { time, available: 0, bookingCount: 0, isFull: false, isPast };
      });
      return res.json({ doctorAvailableOnDate: false, slots: blocked });
    }

    // Step 2: get admin-configured slot availability
    Doctor.getSlotsByDoctorAndDate(doctor_id, date, (err, slotRows) => {
      if (err) {
        console.error("getSlots: getSlotsByDoctorAndDate error:", err);
        return res.status(500).json({ error: err.message });
      }

      // Step 3: get actual booking counts per slot from appointments table
      const countSql = `
        SELECT time, COUNT(*) AS booking_count
        FROM appointments
        WHERE doctor_id = ? AND DATE(date) = ? AND status != 'cancelled'
        GROUP BY time
      `;
      db.query(countSql, [doctor_id, date], (err, countRows) => {
        if (err) {
          console.error("getSlots: booking count query error:", err);
          return res.status(500).json({ error: err.message });
        }

        // Build lookup maps
        const adminMap = {};
        (slotRows || []).forEach(row => { adminMap[row.time] = Number(row.available); });

        const bookingCountMap = {};
        (countRows || []).forEach(row => { bookingCountMap[row.time] = Number(row.booking_count); });

        // Merge: a slot is available only if:
        //   - admin enabled it
        //   - not full
        //   - not in the past (when date is today)
        const fullSlots = ALL_SLOTS.map(time => {
          const slotHour   = parseInt(time.split(':')[0], 10);
          const isPast     = isToday && slotHour <= nowHour;
          const adminEnabled = adminMap[time] !== undefined ? adminMap[time] : 0;
          const bookingCount = bookingCountMap[time] || 0;
          const isFull       = bookingCount >= MAX_BOOKINGS_PER_SLOT;
          // available = 0 if past, if admin disabled, or if slot is full
          const available    = (!isPast && adminEnabled === 1 && !isFull) ? 1 : 0;

          return { time, available, bookingCount, isFull, isPast };
        });

        let doctorAvailableOnDate = null;
        if (availRow !== null) {
          doctorAvailableOnDate = Number(availRow.is_available) === 1;
        }

        res.json({ doctorAvailableOnDate, slots: fullSlots });
      });
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
  getSlotConfig,
  getSlots, saveSlots,
  setDoctorDateAvailability, getDoctorDateAvailability
};