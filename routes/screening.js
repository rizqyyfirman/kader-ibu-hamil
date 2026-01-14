const express = require('express');
const router = express.Router();
const Screening = require('../models/Screening');
const Warga = require('../models/Warga');
const XLSX = require('xlsx');

// Save Screening
router.post('/save', async (req, res) => {
    try {
        const { wargaId, userId, pertanyaan } = req.body;

        // Scoring
        const scoring = {
            penghasilanKurangUMR: pertanyaan.penghasilanKurangUMR ? 1 : 0,
            hamilLebihSatuKali: pertanyaan.hamilLebihSatuKali ? 1 : 0,
            keturunanKeracunan: pertanyaan.keturunanKeracunan ? 2 : 0,
            usiaBerisiko: pertanyaan.usiaBerisiko ? 2 : 0,
            riwayatTekananDarah: pertanyaan.riwayatTekananDarah ? 5 : 0,
            gemuk: pertanyaan.gemuk ? 6 : 0,
            riwayatKeracunan: pertanyaan.riwayatKeracunan ? 8 : 0,
            riwayatDM: pertanyaan.riwayatDM ? 8 : 0
        };

        // Total Skor
        const totalSkor = Object.values(scoring).reduce((sum, val) => sum + val, 0);

        // Kategori Risiko
        let kategoriRisiko, rekomendasi;
        if (totalSkor < 8) {
            kategoriRisiko = 'Risiko Rendah';
            rekomendasi = 'Lakukan edukasi pencegahan preeklampsia dan anjurkan rutin periksa kehamilan';
        } else {
            kategoriRisiko = 'Risiko Tinggi';
            rekomendasi = 'Segera periksakan ke bidan/puskesmas (≤24 jam) dan jika ada tanda bahaya langsung bawa ke IGD/Rumah sakit';
        }

        const newScreening = new Screening({
            wargaId,
            userId,
            pertanyaan,
            scoring,
            totalSkor,
            kategoriRisiko,
            rekomendasi
        });

        await newScreening.save();

        res.json({ 
            success: true, 
            message: 'Screening berhasil disimpan',
            screening: newScreening 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Get Riwayat Screening
router.get('/riwayat/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Cari semua warga milik user
        const wargaList = await Warga.find({ userId });

        if (wargaList.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Ambil screening untuk setiap warga
        const result = [];
        for (const warga of wargaList) {
            const screenings = await Screening.find({ wargaId: warga._id }).sort({ tanggalPemeriksaan: -1 });
            if (screenings.length > 0) {
                result.push({
                    warga: warga,
                    screenings: screenings
                });
            }
        }

        res.json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Get Detail Screening
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const screening = await Screening.findById(id).populate('wargaId');

        if (!screening) {
            return res.status(404).json({ success: false, message: 'Screening tidak ditemukan' });
        }

        res.json({ success: true, data: screening });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Download Excel
router.get('/download-excel/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Cari semua warga milik user
        const wargaList = await Warga.find({ userId });

        if (wargaList.length === 0) {
            return res.status(404).json({ success: false, message: 'Tidak ada data untuk diunduh' });
        }

        // Siapkan data untuk Excel
        const excelData = [];
        const mergeRanges = []; // Array untuk menyimpan range merge cells
        let currentRow = 1; // Mulai dari row 1 (row 0 adalah header)
        
        for (const warga of wargaList) {
            const screenings = await Screening.find({ wargaId: warga._id }).sort({ tanggalPemeriksaan: 1 });
            
            if (screenings.length > 0) {
                const startRow = currentRow; // Row awal untuk nama ini
                
                screenings.forEach((screening, index) => {
                    const tanggal = new Date(screening.tanggalPemeriksaan);
                    const tanggalFormatted = `${tanggal.getDate()} ${getMonthName(tanggal.getMonth())} ${tanggal.getFullYear()} pukul ${String(tanggal.getHours()).padStart(2, '0')}.${String(tanggal.getMinutes()).padStart(2, '0')}`;
                    
                    excelData.push({
                        'Nama': warga.nama,
                        'Pemeriksaan': index + 1,
                        'Tanggal Pemeriksaan': tanggalFormatted,
                        'Nakes/Kader': warga.nakesKader,
                        'Dx': warga.dx || '-',
                        'Total Skor': screening.totalSkor,
                        'Kategori Risiko': screening.kategoriRisiko
                    });
                    
                    currentRow++;
                });
                
                const endRow = currentRow - 1; // Row akhir untuk nama ini
                
                // Jika ada lebih dari 1 screening untuk warga ini, merge cell nama
                if (screenings.length > 1) {
                    mergeRanges.push({
                        s: { r: startRow, c: 0 }, // start: row, column (0 = kolom Nama)
                        e: { r: endRow, c: 0 }    // end: row, column
                    });
                }
            }
        }

        // Buat workbook dan worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 20 }, // Nama
            { wch: 12 }, // Pemeriksaan
            { wch: 28 }, // Tanggal Pemeriksaan
            { wch: 20 }, // Nakes/Kader
            { wch: 15 }, // Dx
            { wch: 12 }, // Total Skor
            { wch: 15 }  // Kategori Risiko
        ];

        // Apply merge cells
        worksheet['!merges'] = mergeRanges;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Screening');

        // Generate buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set headers untuk download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Riwayat_Screening_${new Date().getTime()}.xlsx`);
        
        res.send(excelBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Get All Data for Admin
router.get('/admin/all-data', async (req, res) => {
    try {
        // Ambil semua warga
        const allWarga = await Warga.find().populate('userId', 'namaLengkap');

        if (allWarga.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Ambil screening untuk setiap warga
        const result = [];
        for (const warga of allWarga) {
            const screenings = await Screening.find({ wargaId: warga._id }).sort({ tanggalPemeriksaan: -1 });
            if (screenings.length > 0) {
                result.push({
                    warga: warga,
                    screenings: screenings
                });
            }
        }

        res.json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Download Excel for Admin (All Data)
router.get('/admin/download-excel', async (req, res) => {
    try {
        // Ambil semua warga
        const allWarga = await Warga.find().populate('userId', 'namaLengkap');

        if (allWarga.length === 0) {
            return res.status(404).json({ success: false, message: 'Tidak ada data untuk diunduh' });
        }

        const excelData = [];
        const mergeRanges = [];
        let currentRow = 1;
        
        for (const warga of allWarga) {
            const screenings = await Screening.find({ wargaId: warga._id }).sort({ tanggalPemeriksaan: 1 });
            
            if (screenings.length > 0) {
                const startRow = currentRow;
                
                screenings.forEach((screening, index) => {
                    const tanggal = new Date(screening.tanggalPemeriksaan);
                    const tanggalFormatted = `${tanggal.getDate()} ${getMonthName(tanggal.getMonth())} ${tanggal.getFullYear()} pukul ${String(tanggal.getHours()).padStart(2, '0')}.${String(tanggal.getMinutes()).padStart(2, '0')}`;
                    
                    excelData.push({
                        'Nakes/Kader': warga.nakesKader,
                        'Nama': warga.nama,
                        'Pemeriksaan': index + 1,
                        'Tanggal Pemeriksaan': tanggalFormatted,
                        'Dx': warga.dx || '-',
                        'Total Skor': screening.totalSkor,
                        'Kategori Risiko': screening.kategoriRisiko
                    });
                    
                    currentRow++;
                });
                
                const endRow = currentRow - 1;
                
                // Merge cells untuk Nakes/Kader (kolom 0) dan Nama (kolom 1)
                if (screenings.length > 1) {
                    mergeRanges.push({
                        s: { r: startRow, c: 0 }, // Nakes/Kader
                        e: { r: endRow, c: 0 }
                    });
                    mergeRanges.push({
                        s: { r: startRow, c: 1 }, // Nama
                        e: { r: endRow, c: 1 }
                    });
                }
            }
        }

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        worksheet['!cols'] = [
            { wch: 20 }, // Nakes/Kader
            { wch: 20 }, // Nama
            { wch: 12 }, // Pemeriksaan
            { wch: 28 }, // Tanggal Pemeriksaan
            { wch: 15 }, // Dx
            { wch: 12 }, // Total Skor
            { wch: 15 }  // Kategori Risiko
        ];

        worksheet['!merges'] = mergeRanges;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'All Data Screening');

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=All_Data_Screening_${new Date().getTime()}.xlsx`);
        
        res.send(excelBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
    }
});

// Helper function untuk nama bulan
function getMonthName(month) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month];
}

module.exports = router;