// =====================================================
// controllers/authController.js — Registrasi & Login
// =====================================================
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();

// Register user baru
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

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

    // Insert user (uang bulanan default 0, user isi sendiri nanti)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, monthly_allowance) VALUES (?, ?, ?, 0)',
      [name, email, hashedPassword]
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
        monthly_allowance: 0,
        profile_photo: null,
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
        profile_photo: user.profile_photo,
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
      'SELECT id, name, email, monthly_allowance, profile_photo, created_at FROM users WHERE id = ?',
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

// Update profile (nama, email, uang bulanan)
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, monthly_allowance } = req.body;

    // Jika email diubah, cek duplikasi
    if (email) {
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.id]
      );
      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email sudah digunakan oleh user lain.',
        });
      }
    }

    await pool.query(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), monthly_allowance = COALESCE(?, monthly_allowance) WHERE id = ?',
      [name, email, monthly_allowance, req.user.id]
    );

    const [users] = await pool.query(
      'SELECT id, name, email, monthly_allowance, profile_photo, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ success: true, message: 'Profil berhasil diupdate.', data: users[0] });
  } catch (error) {
    next(error);
  }
};

// Upload foto profil
const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File foto profil wajib diupload.',
      });
    }

    const photoPath = `/uploads/profiles/${req.file.filename}`;

    const [users] = await pool.query(
      'SELECT profile_photo FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    const oldPhoto = users[0].profile_photo;

    await pool.query(
      'UPDATE users SET profile_photo = ? WHERE id = ?',
      [photoPath, req.user.id]
    );

    if (oldPhoto && oldPhoto.startsWith('/uploads/profiles/')) {
      const oldPhotoPath = path.join(__dirname, '..', oldPhoto.replace(/^\//, ''));
      fs.unlink(oldPhotoPath, () => {});
    }

    const [updatedUsers] = await pool.query(
      'SELECT id, name, email, monthly_allowance, profile_photo, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Foto profil berhasil diupload.',
      data: updatedUsers[0],
    });
  } catch (error) {
    next(error);
  }
};

// Ganti password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password lama dan password baru wajib diisi.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter.',
      });
    }

    // Ambil password user saat ini
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    // Verifikasi password lama
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password lama tidak sesuai.',
      });
    }

    // Hash & simpan password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (error) {
    next(error);
  }
};

// Verifikasi password saat ini (untuk step 1 ubah password)
const verifyPassword = async (req, res, next) => {
  try {
    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini wajib diisi.',
      });
    }

    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password saat ini tidak sesuai.',
      });
    }

    res.json({ success: true, message: 'Password terverifikasi.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, updateProfile, uploadProfilePhoto, changePassword, verifyPassword };
