const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require("./routes/auth.routes");

// Use routes
app.use("/", authRoutes);

app.get("/", (req, res) => {
  res.send("API running ");
});

module.exports = app;

const doctorRoutes = require("./routes/doctor.routes");
app.use("/", doctorRoutes);

const appointmentRoutes = require("./routes/appointment.routes");
app.use("/", appointmentRoutes);

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));