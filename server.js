// File: server.js - TEMPORARY MINIMAL DEBUGGING VERSION (Re-created)

console.log("DEBUG: Starting minimal server...");
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables first

const app = express(); // Initialize Express app
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic route that does not depend on any other modules or Firebase
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Minimal server is operational.",
        status: "OK",
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Minimal server is running on port ${PORT}`);
});

export default app; // Essential for Vercel deployment
