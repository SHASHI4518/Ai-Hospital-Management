const User = require("../models/user.model");
const db = require('../config/db');  

// Signup
const signup = (req, res) => {
  const { name, mobile, password } = req.body;

  if (!name || !mobile || !password) {
    return res.send("All fields required");
  }

  const user = { name, mobile, password, };

  const userRole = 'user';

  User.createUser(name, mobile, password, userRole, (err, result) => {
    if (err) {
      return res.send("Mobile already exists or error");
    }
    res.send("Signup successful");
  });
};

// Login
const login = (req, res) => {
 
  console.log("Login API HIT");
  const { mobile, password } = req.body;

  const sql = "SELECT * FROM users WHERE mobile=? AND password=?";

  db.query(sql, [mobile, password], (err, result) => {

    if (err) {
      console.log(err);
      return res.send("Error");
    }

    if (result.length > 0) {
      return res.send("Login successful");  
    } else {
      return res.send("Invalid credentials");
    }

  });
};

// Admin Signup
const adminSignup = (req, res) => {

  const { name, mobile, password } = req.body;

  const sql = "INSERT INTO admins (name, mobile, password) VALUES (?, ?, ?)";

  db.query(sql, [name, mobile, password], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Error registering admin");
    }
    res.json({ message: "Admin registered successfully" });
  });
};

// Admin Login
const adminLogin = (req, res) => {

  const { mobile, password } = req.body;

  const sql = "SELECT * FROM admins WHERE mobile=? AND password=?";

  db.query(sql, [mobile, password], (err, results) => {

    if (err) {
      console.log(err);
      return res.send("Error");
    }

    if (results.length > 0) {
      res.json({
        message: "Admin login success",
        admin: results[0]
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });
};
module.exports = { signup, login, adminSignup, adminLogin };   