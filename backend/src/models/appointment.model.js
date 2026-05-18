const db = require("../config/db");

//  Create appointment with patient name
const createAppointment = (data, callback) => {

  //  First get patient name
  const getUser = "SELECT name FROM users WHERE mobile = ?";

  db.query(getUser, [data.user_mobile], (err, userResult) => {

    if (err) return callback(err, null);

    if (userResult.length === 0) {
      return callback("User not found", null);
    }

    const patient_name = userResult[0].name;

    //  Insert with patient_name
    const sql = `
      INSERT INTO appointments 
      (user_mobile, patient_name, doctor_id, date, time) 
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [data.user_mobile, patient_name, data.doctor_id, data.date, data.time],
      callback
    );
  });
};

// Get appointments for user
const getAppointmentsByUser = (mobile, callback) => {
  const sql = "SELECT * FROM appointments WHERE user_mobile = ?";
  db.query(sql, [mobile], callback);
};

// Cancel appointment
const cancelAppointment = (id, callback) => {
  const sql = "UPDATE appointments SET status='cancelled' WHERE id = ?";
  db.query(sql, [id], callback);
};

// Slot check
const checkSlotCount = (doctor_id, date, time, callback) => {
  const sql = `
    SELECT COUNT(*) as count 
    FROM appointments 
    WHERE doctor_id = ? AND date = ? AND time = ?
  `;
  db.query(sql, [doctor_id, date, time], callback);
};

// Slot counts
const getSlotCounts = (doctor_id, date, callback) => {
  const sql = `
    SELECT time, COUNT(*) as count 
    FROM appointments 
    WHERE doctor_id = ? AND date = ?
    GROUP BY time
  `;
  db.query(sql, [doctor_id, date], callback);
};

// Delete
const deleteAppointment = (id, callback) => {
  const sql = "DELETE FROM appointments WHERE id = ?";
  db.query(sql, [id], callback);
};

module.exports = {
  createAppointment,
  getAppointmentsByUser,
  cancelAppointment,
  checkSlotCount,
  getSlotCounts,
  deleteAppointment
};