const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// --------------- Health Check ---------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --------------- Routes ---------------
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// --------------- 404 Fallback ---------------
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// --------------- Error Handler (must be last) ---------------
app.use(errorHandler);

module.exports = app;
