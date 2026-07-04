const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

// Simple email regex — covers the vast majority of valid addresses
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Creates a new user after validating inputs.
 */
const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ---------- Validation ----------
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 characters" });
    }

    // ---------- Duplicate check ----------
    const existingUser = await prisma.user.findUnique({ where: { email: trimmedEmail } });

    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email already in use" });
    }

    // ---------- Create user ----------
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email: trimmedEmail, password: hashedPassword },
    });

    res.status(201).json({
      success: true,
      data: { id: user.id, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticates an existing user and returns a signed JWT.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ---------- Validation ----------
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // ---------- Find user ----------
    const user = await prisma.user.findUnique({ where: { email: trimmedEmail } });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // ---------- Verify password ----------
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // ---------- Sign token ----------
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
