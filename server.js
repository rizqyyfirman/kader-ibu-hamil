require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// MongoDB Connection dengan environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kader-ibu-hamil';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const wargaRoutes = require('./routes/warga');
const screeningRoutes = require('./routes/screening');

app.use('/api/auth', authRoutes);
app.use('/api/warga', wargaRoutes);
app.use('/api/screening', screeningRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.get('/screening', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'screening.html'));
});

app.get('/edukasi', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'edukasi.html'));
});

app.get('/riwayat', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'riwayat.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Port dengan environment variable
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});