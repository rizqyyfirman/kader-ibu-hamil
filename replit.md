# Kader Ibu Hamil - Education & Data Collection System

## Overview
A web application for healthcare workers (kader) to manage pregnant women's data and conduct health screenings. Built with Node.js/Express backend serving static HTML pages, using MongoDB for data storage.

## Project Structure
```
├── server.js          # Express server entry point
├── models/            # Mongoose data models
│   ├── User.js        # User authentication model
│   ├── Warga.js       # Resident data model
│   └── Screening.js   # Health screening records
├── routes/            # API route handlers
│   ├── auth.js        # Authentication endpoints
│   ├── warga.js       # Resident management
│   └── screening.js   # Screening operations
├── views/             # HTML pages
│   ├── index.html     # Login page
│   ├── home.html      # Dashboard
│   ├── screening.html # Screening form
│   ├── edukasi.html   # Education content
│   ├── riwayat.html   # History view
│   └── admin.html     # Admin panel
└── public/            # Static assets (JS, CSS, images)
```

## Configuration

### Environment Variables
- `MONGODB_URI` - MongoDB connection string (required for full functionality)
- `JWT_SECRET` - Secret key for JWT authentication
- `PORT` - Server port (default: 5000)

### Database
This application requires MongoDB. Set the `MONGODB_URI` environment variable to your MongoDB connection string.

## Running Locally
```bash
npm install
npm start
```

Server runs on `http://0.0.0.0:5000`

## Recent Changes
- 2026-01-14: Configured for Replit environment (port 5000, host 0.0.0.0)
