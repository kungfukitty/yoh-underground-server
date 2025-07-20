// File: server.js - COMPLETE AND UP-TO-DATE (Production Version Restored)

console.log("SERVER START: Entering server.js execution.");
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { auth, db, bucket, adminApp } from './config/firebaseAdminInit.js'; 


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

console.log("DEBUG: Server starting...");

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    console.error("FATAL: JWT_SECRET is NOT set!");
    process.exit(1);
} else {
    console.log("DEBUG: JWT_SECRET is set (length:", jwtSecret.length, ")");
}

const corsOptions = {
    origin: 'http://www.yohunderground.fun',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

app.use(express.json());


app.get('/', (req, res) => {
    res.status(200).json({
        message: "YOH Underground Server is operational.",
        status: "OK",
        timestamp: new Date().toISOString(),
        envCheck: "See logs for Firebase initialization status (from firebaseAdminInit.js)."
    });
});

import authRoutes from './routes/authRoutes.js';
app.use('/api/auth', authRoutes);

import memberRoutes from './routes/memberRoutes.js';
app.use('/api/member', memberRoutes);

import eventRoutes from './routes/eventRoutes.js';
app.use('/api/events', eventRoutes);

import adminRoutes from './routes/adminRoutes.js';
app.use('/api/admin', adminRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
