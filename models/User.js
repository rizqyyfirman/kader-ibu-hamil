const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    namaLengkap: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    passwordRecovery: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    tanggalLahir: {
        type: Date,
        required: true
    },
    alamat: {
        type: String,
        required: true
    },
    nomorTelepon: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);