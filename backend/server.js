const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { clerkMiddleware } = require('@clerk/express');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173', 'http://127.0.0.1:5173',
        'http://localhost:8080', 'http://127.0.0.1:8080',
        'http://localhost:8081', 'http://127.0.0.1:8081',
        process.env.FRONTEND_URL  // Your Vercel frontend URL, e.g. https://your-app.vercel.app
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB Atlas');
        // Drop stale index from legacy schema if it exists
        try {
            await mongoose.connection.collection('profiles').dropIndex('user_1');
            console.log('Dropped stale user_1 index');
        } catch (e) {
            // Index doesn't exist — that's fine
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Clerk authentication middleware - adds req.auth to all subsequent requests
// This is permissive: unauthenticated requests still go through, but req.auth is populated when a token is present
app.use(clerkMiddleware());

// Routes
const jobsRoutes = require('./routes/jobs');
app.use('/api/jobs', jobsRoutes);

const profileRoutes = require('./routes/profile');
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
    res.send('Simplyfy.jobs API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// Only listen when running locally (not on Vercel)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel Serverless
module.exports = app;
