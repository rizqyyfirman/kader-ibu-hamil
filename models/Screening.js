const mongoose = require('mongoose');

const screeningSchema = new mongoose.Schema({
    wargaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warga',
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    tanggalPemeriksaan: {
        type: Date,
        default: Date.now
    },
    pertanyaan: {
        penghasilanKurangUMR: { type: Boolean, required: true },
        hamilLebihSatuKali: { type: Boolean, required: true },
        keturunanKeracunan: { type: Boolean, required: true },
        usiaBerisiko: { type: Boolean, required: true },
        riwayatTekananDarah: { type: Boolean, required: true },
        gemuk: { type: Boolean, required: true },
        riwayatKeracunan: { type: Boolean, required: true },
        riwayatDM: { type: Boolean, required: true }
    },
    scoring: {
        penghasilanKurangUMR: { type: Number, default: 0 },
        hamilLebihSatuKali: { type: Number, default: 0 },
        keturunanKeracunan: { type: Number, default: 0 },
        usiaBerisiko: { type: Number, default: 0 },
        riwayatTekananDarah: { type: Number, default: 0 },
        gemuk: { type: Number, default: 0 },
        riwayatKeracunan: { type: Number, default: 0 },
        riwayatDM: { type: Number, default: 0 }
    },
    totalSkor: {
        type: Number,
        required: true
    },
    kategoriRisiko: {
        type: String,
        enum: ['Risiko Rendah', 'Risiko Tinggi'],
        required: true
    },
    rekomendasi: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Screening', screeningSchema);