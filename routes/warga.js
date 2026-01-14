const express = require('express');
const router = express.Router();
const Warga = require('../models/Warga');
const Screening = require('../models/Screening');

// Add Warga
router.post('/add', async (req, res) => {
    try {
        const { nama, nik, noReg, nakesKader, dx, userId } = req.body;

        const newWarga = new Warga({
            nama: nama.trim(),
            nik: nik.trim(),
            noReg: noReg.trim(),
            nakesKader: nakesKader.trim(),
            dx: dx.trim(),
            userId
        });

        await newWarga.save();

        res.json({ 
            success: true, 
            message: 'Data warga berhasil ditambahkan',
            warga: newWarga 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Get List Warga
router.get('/list/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const wargaList = await Warga.find({ userId }).sort({ createdAt: -1 });

        res.json({ success: true, data: wargaList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Get Warga by ID
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const warga = await Warga.findById(id);

        if (!warga) {
            return res.status(404).json({ success: false, message: 'Data warga tidak ditemukan' });
        }

        res.json({ success: true, data: warga });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Update Warga
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, nik, noReg, nakesKader, dx } = req.body;

        const warga = await Warga.findById(id);

        if (!warga) {
            return res.status(404).json({ success: false, message: 'Data warga tidak ditemukan' });
        }

        // Update fields
        warga.nama = nama.trim();
        warga.nik = nik.trim();
        warga.noReg = noReg.trim();
        warga.nakesKader = nakesKader.trim();
        warga.dx = dx.trim();

        await warga.save();

        res.json({ 
            success: true, 
            message: 'Data warga berhasil diperbarui',
            warga: warga 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Delete Warga
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const warga = await Warga.findById(id);

        if (!warga) {
            return res.status(404).json({ success: false, message: 'Data warga tidak ditemukan' });
        }

        // Hapus semua screening yang terkait dengan warga ini
        await Screening.deleteMany({ wargaId: id });

        // Hapus warga
        await Warga.findByIdAndDelete(id);

        res.json({ 
            success: true, 
            message: 'Data warga dan semua riwayat screening berhasil dihapus'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
    }
});

module.exports = router;    