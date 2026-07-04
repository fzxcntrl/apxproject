const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// --------------- Health Check ---------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;
