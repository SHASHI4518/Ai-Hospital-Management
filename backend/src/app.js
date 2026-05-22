const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/auth.routes");
app.use("/", authRoutes);

const doctorRoutes = require("./routes/doctor.routes");
app.use("/", doctorRoutes);

const appointmentRoutes = require("./routes/appointment.routes");
app.use("/", appointmentRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get("/", (req, res) => res.send("Hospital API running"));

module.exports = app;