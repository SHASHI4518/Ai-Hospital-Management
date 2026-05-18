const db = require('../config/db'); 

// Get all doctors
const getAllDoctors = (callback) => {
  db.query("SELECT * FROM doctors", callback);
};

// Add new doctor
const addDoctor = (doctor, callback) => {

  const sql = `
    INSERT INTO doctors 
    (name, specialization, experience, location, clinic, fee, image,available) 
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
    doctor.available , 
    id
  ], (err, result) => {

  console.log("DB RESULT:", result);   
  console.log("ID SENT:", id);
  callback(err, result);
});
}

const addSlot = (doctor_id, time, callback) => {
  const sql = "INSERT INTO doctor_slots (doctor_id, time) VALUES (?, ?)";
  db.query(sql, [doctor_id, time], callback);
};

const getSlotsByDoctor = (doctor_id, callback) => {
  const sql = "SELECT * FROM doctor_slots WHERE doctor_id = ?";
  
  console.log("QUERY doctor_id:", doctor_id);

  db.query(sql, [doctor_id], (err, results) => {
    if (err) {
      console.log("DB ERROR:", err);
      return callback(err, null);
    }

    console.log("DB RESULT:", results); 

    callback(null, results);
  });
};

const deleteSlot = (id, callback) => {
  const sql = "DELETE FROM doctor_slots WHERE id = ?";
  db.query(sql, [id], callback);
};

module.exports = {
  getAllDoctors,
  addDoctor,
  deleteDoctor,
  updateDoctor,
  addSlot,
  getSlotsByDoctor,
  deleteSlot
};
