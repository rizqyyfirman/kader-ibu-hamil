const mongoose = require('mongoose');

const wargaSchema = new mongoose.Schema({
    nama: {
        type: String,
        required: true
    },
    nik: {
        type: String,
        required: true,
        unique: true
    },
    noReg: {
        type: String,
        required: true,
        unique: true
    },
    nakesKader: {
        type: String,
        required: true
    },
    dx: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Warga', wargaSchema);