const db = require('../config/db'); 

// Get all doctors
const getAllDoctors = (callback) => {
  db.query("SELECT * FROM doctors", callback);
};

// Add new doctor
const addDoctor = (doctor, callback) => {
  const sql = `
    INSERT INTO doctors 
    (name, specialization, experience, location, clinic, fee, image, available) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [
    doctor.name,
    doctor.specialization,
    doctor.experience,
    doctor.location,
    doctor.clinic,
    doctor.fee,
    doctor.image,
    doctor.available
  ], callback);
};

// Delete doctor
const deleteDoctor = (id, callback) => {
  db.query("DELETE FROM doctors WHERE id = ?", [id], callback);
};

// Update doctor
const updateDoctor = (id, doctor, callback) => {
  const sql = `
    UPDATE doctors 
    SET name=?, specialization=?, experience=?, location=?, clinic=?, fee=?, image=?, available=?
    WHERE id = CAST(? AS UNSIGNED)
  `;
  db.query(sql, [
    doctor.name,
    doctor.specialization,
    doctor.experience,
    doctor.location,
    doctor.clinic,
    doctor.fee,
    doctor.image,
    doctor.available,
    id
  ], (err, result) => {
    console.log("DB RESULT:", result);
    console.log("ID SENT:", id);
    callback(err, result);
  });
};

// ─── TIME SLOTS (date-aware) ───────────────────────────────────────────────

const addSlot = (doctor_id, date, time, callback) => {
  const sql = `
    INSERT INTO doctor_slots (doctor_id, date, time, available)
    VALUES (?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE available = 1
  `;
  db.query(sql, [doctor_id, date, time], callback);
};

const getSlotsByDoctor = (doctor_id, date, callback) => {
  const sql = "SELECT * FROM doctor_slots WHERE doctor_id = ? AND date = ?";
  console.log("QUERY doctor_id:", doctor_id, "date:", date);
  db.query(sql, [doctor_id, date], (err, results) => {
    if (err) { console.log("DB ERROR:", err); return callback(err, null); }
    console.log("DB RESULT:", results);
    callback(null, results);
  });
};

const deleteSlot = (id, callback) => {
  const sql = "DELETE FROM doctor_slots WHERE id = ?";
  db.query(sql, [id], callback);
};

// ─── DATE-WISE DOCTOR AVAILABILITY ────────────────────────────────────────

/**
 * Upsert a date-specific availability override for a doctor.
 * doctor_availability table: (doctor_id, date, is_available)
 */
const setDoctorAvailabilityForDate = (doctor_id, date, is_available, callback) => {
  const sql = `
    INSERT INTO doctor_availability (doctor_id, date, is_available)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE is_available = VALUES(is_available)
  `;
  db.query(sql, [doctor_id, date, is_available ? 1 : 0], callback);
};

/**
 * Get date-wise availability. Returns null if no override → fall back to global.
 */
const getDoctorAvailabilityForDate = (doctor_id, date, callback) => {
  const sql = "SELECT is_available FROM doctor_availability WHERE doctor_id = ? AND date = ?";
  db.query(sql, [doctor_id, date], (err, rows) => {
    if (err) return callback(err, null);
    callback(null, rows.length > 0 ? rows[0] : null);
  });
};

module.exports = {
  getAllDoctors,
  addDoctor,
  deleteDoctor,
  updateDoctor,
  addSlot,
  getSlotsByDoctor,
  deleteSlot,
  setDoctorAvailabilityForDate,
  getDoctorAvailabilityForDate
};
