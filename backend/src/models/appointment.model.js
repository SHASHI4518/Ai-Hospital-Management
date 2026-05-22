const db = require("../config/db");

const createAppointment = (data, callback) => {
  db.query("SELECT name FROM users WHERE mobile = ?", [data.user_mobile], (err, userResult) => {
    if (err) return callback(err, null);
    if (userResult.length === 0) return callback("User not found", null);
    const patient_name = userResult[0].name;
    const sql = `
      INSERT INTO appointments (user_mobile, patient_name, doctor_id, date, time)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [data.user_mobile, patient_name, data.doctor_id, data.date, data.time], callback);
  });
};

const getAppointmentsByUser = (mobile, callback) => {
  db.query("SELECT * FROM appointments WHERE user_mobile = ? ORDER BY date DESC", [mobile], callback);
};

// Status update — NOT a delete
const cancelAppointment = (id, callback) => {
  db.query("UPDATE appointments SET status='cancelled' WHERE id = ?", [id], callback);
};

const checkSlotCount = (doctor_id, date, time, callback) => {
  const sql = `
    SELECT COUNT(*) as count FROM appointments
    WHERE doctor_id = ? AND date = ? AND time = ? AND status != 'cancelled'
  `;
  db.query(sql, [doctor_id, date, time], callback);
};

const getSlotCounts = (doctor_id, date, callback) => {
  const sql = `
    SELECT time, COUNT(*) as count FROM appointments
    WHERE doctor_id = ? AND date = ? AND status != 'cancelled'
    GROUP BY time
  `;
  db.query(sql, [doctor_id, date], callback);
};

const deleteAppointment = (id, callback) => {
  db.query("DELETE FROM appointments WHERE id = ?", [id], callback);
};

module.exports = {
  createAppointment, getAppointmentsByUser, cancelAppointment,
  checkSlotCount, getSlotCounts, deleteAppointment
};