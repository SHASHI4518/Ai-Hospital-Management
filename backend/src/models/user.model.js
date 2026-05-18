const db = require("../config/db");

// Signup function
const createUser = (name, mobile, password, role, callback) => {
  const sql = "INSERT INTO users (name, mobile, password, role) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, mobile, password, role], callback);
};

module.exports = { createUser };

// Login function
const findUserByMobile = (mobile, callback) => {
  const sql = "SELECT * FROM users WHERE mobile = ?";
  db.query(sql, [mobile], callback);
};

module.exports = { createUser, findUserByMobile };