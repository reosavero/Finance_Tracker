// =====================================================
// controllers/authController.js — Registrasi & Login
// =====================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();

// Register user baru
const register = async (req, res, next) => {
  try {
    const { name, email, password, monthly_allowance } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi.',
      });
    }

    // Cek email sudah terdaftar
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, monthly_allowance) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, monthly_allowance || 0]
    );

    // Generate token
    const token = jwt.sign(
      { id: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil!',
      data: {
        id: result.insertId,
        name,
        email,
        monthly_allowance: monthly_allowance || 0,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.',
      });
    }

    // Cari user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    const user = users[0];

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login berhasil!',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        monthly_allowance: user.monthly_allowance,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, monthly_allowance, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    res.json({ success: true, data: users[0] });
  } catch (error) {
    next(error);
  }
};

// Update profile (termasuk uang saku bulanan)
const updateProfile = async (req, res, next) => {
  try {
    const { name, monthly_allowance } = req.body;
    
    await pool.query(
      'UPDATE users SET name = COALESCE(?, name), monthly_allowance = COALESCE(?, monthly_allowance) WHERE id = ?',
      [name, monthly_allowance, req.user.id]
    );

    const [users] = await pool.query(
      'SELECT id, name, email, monthly_allowance FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ success: true, message: 'Profil berhasil diupdate.', data: users[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, updateProfile };
