const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Admin credentials (hardcoded)
const ADMIN_CREDENTIALS = {
    userId: 'admin',
    password: 'Polkesbaya123',
    namaLengkap: 'Administrator'
};

// Check User ID Availability
router.get('/check-userid', async (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ available: false, message: 'User ID diperlukan' });
        }
        
        // Block admin userId
        if (userId.trim().toLowerCase() === 'admin') {
            return res.json({ available: false, message: 'User ID tidak tersedia' });
        }
        
        const existingUser = await User.findOne({ userId: userId.trim() });
        
        if (existingUser) {
            return res.json({ available: false, message: 'User ID sudah digunakan' });
        }
        
        return res.json({ available: true, message: 'User ID tersedia' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ available: false, message: 'Terjadi kesalahan server' });
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { namaLengkap, userId, password, confirmPassword, email, tanggalLahir, alamat, nomorTelepon } = req.body;

        // Trim all string inputs
        const trimmedUserId = userId.trim();
        const trimmedNamaLengkap = namaLengkap.trim();
        const trimmedEmail = email.trim();
        const trimmedAlamat = alamat.trim();
        const trimmedNomorTelepon = nomorTelepon.trim();

        // Block admin userId
        if (trimmedUserId.toLowerCase() === 'admin') {
            return res.status(400).json({ message: 'User ID tidak dapat digunakan' });
        }

        // Validasi password match
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Password dan konfirmasi password tidak cocok' });
        }

        // Validasi format password (minimal 1 huruf besar dan 1 angka)
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).+$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password harus mengandung minimal 1 huruf besar dan 1 angka' });
        }

        // Cek apakah userId atau email sudah ada
        const existingUser = await User.findOne({ $or: [{ userId: trimmedUserId }, { email: trimmedEmail }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User ID atau Email sudah terdaftar' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Buat user baru
        const newUser = new User({
            namaLengkap: trimmedNamaLengkap,
            userId: trimmedUserId,
            password: hashedPassword,
            passwordRecovery: password,
            email: trimmedEmail,
            tanggalLahir,
            alamat: trimmedAlamat,
            nomorTelepon: trimmedNomorTelepon
        });

        await newUser.save();

        res.status(201).json({ message: 'Registrasi berhasil!', success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { userId, password } = req.body;

        const trimmedUserId = userId.trim();

        // Check if admin login
        if (trimmedUserId === ADMIN_CREDENTIALS.userId && password === ADMIN_CREDENTIALS.password) {
            const token = jwt.sign(
                { userId: ADMIN_CREDENTIALS.userId, namaLengkap: ADMIN_CREDENTIALS.namaLengkap, isAdmin: true },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                message: 'Login berhasil!',
                success: true,
                isAdmin: true,
                token,
                user: {
                    userId: ADMIN_CREDENTIALS.userId,
                    namaLengkap: ADMIN_CREDENTIALS.namaLengkap
                }
            });
        }

        // Regular user login
        const user = await User.findOne({ userId: trimmedUserId });
        if (!user) {
            return res.status(400).json({ message: 'User ID atau Password salah' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'User ID atau Password salah' });
        }

        const token = jwt.sign(
            { userId: user.userId, namaLengkap: user.namaLengkap, isAdmin: false },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login berhasil!',
            success: true,
            isAdmin: false,
            token,
            user: {
                userId: user.userId,
                namaLengkap: user.namaLengkap,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Lupa Password/ID - Cari Akun
router.post('/forgot', async (req, res) => {
    try {
        const { namaLengkap, tanggalLahir } = req.body;

        const user = await User.findOne({
            namaLengkap: namaLengkap.trim(),
            tanggalLahir: new Date(tanggalLahir)
        });

        if (!user) {
            return res.status(404).json({ message: 'Data tidak ditemukan. Pastikan Nama Lengkap dan Tanggal Lahir benar.' });
        }

        res.json({
            message: 'Data ditemukan!',
            success: true,
            userId: user.userId,
            password: user.passwordRecovery || 'Password tidak tersedia (silakan reset)',
            userIdInternal: user._id.toString()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Update Password Baru
router.post('/reset-password', async (req, res) => {
    try {
        const { userIdInternal, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Password dan konfirmasi password tidak cocok' });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).+$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: 'Password harus mengandung minimal 1 huruf besar dan 1 angka' });
        }

        const user = await User.findById(userIdInternal);
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.passwordRecovery = newPassword;
        await user.save();

        res.json({
            message: 'Password berhasil diubah!',
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
});

module.exports = router;