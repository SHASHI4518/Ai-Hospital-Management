const db = require('../config/db');

const getAllDoctors = (callback) => {
  db.query("SELECT * FROM doctors", callback);
};

const addDoctor = (doctor, callback) => {
  const sql = `
    INSERT INTO doctors 
    (name, specialization, experience, location, clinic, fee, image, available) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [
    doctor.name, doctor.specialization, doctor.experience,
    doctor.location, doctor.clinic, doctor.fee,
    doctor.image, doctor.available
  ], callback);
};

const deleteDoctor = (id, callback) => {
  db.query("DELETE FROM doctors WHERE id = ?", [id], callback);
};

const updateDoctor = (id, doctor, callback) => {
  const sql = `
    UPDATE doctors 
    SET name=?, specialization=?, experience=?, location=?, clinic=?, fee=?, image=?, available=?
    WHERE id = CAST(? AS UNSIGNED)
  `;
  db.query(sql, [
    doctor.name, doctor.specialization, doctor.experience,
    doctor.location, doctor.clinic, doctor.fee,
    doctor.image, doctor.available, id
  ], callback);
};

// ── Date-aware slots ──────────────────────────────────────────────────────────

const upsertSlots = (doctor_id, date, slots, callback) => {
  if (!slots || slots.length === 0) return callback(null);
  const values = slots.map(s => [doctor_id, date, s.time, Number(s.available)]);
  const sql = `
    INSERT INTO doctor_slots (doctor_id, date, time, available)
    VALUES ?
    ON DUPLICATE KEY UPDATE available = VALUES(available)
  `;
  db.query(sql, [values], callback);
};

const getSlotsByDoctorAndDate = (doctor_id, date, callback) => {
  const sql = "SELECT time, available FROM doctor_slots WHERE doctor_id = ? AND date = ?";
  db.query(sql, [doctor_id, date], callback);
};

const deleteSlotById = (id, callback) => {
  db.query("DELETE FROM doctor_slots WHERE id = ?", [id], callback);
};

// ── Date-wise doctor availability ─────────────────────────────────────────────

const setDoctorAvailabilityForDate = (doctor_id, date, is_available, callback) => {
  const sql = `
    INSERT INTO doctor_availability (doctor_id, date, is_available)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE is_available = VALUES(is_available)
  `;
  db.query(sql, [doctor_id, date, is_available ? 1 : 0], callback);
};

const getDoctorAvailabilityForDate = (doctor_id, date, callback) => {
  const sql = "SELECT is_available FROM doctor_availability WHERE doctor_id = ? AND date = ?";
  db.query(sql, [doctor_id, date], (err, rows) => {
    if (err) return callback(err, null);
    callback(null, rows.length > 0 ? rows[0] : null);
  });
};

module.exports = {
  getAllDoctors, addDoctor, deleteDoctor, updateDoctor,
  upsertSlots, getSlotsByDoctorAndDate, deleteSlotById,
  setDoctorAvailabilityForDate, getDoctorAvailabilityForDate
};