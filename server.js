import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// --- Dynamic CORS Config ---
const allowedOrigins = new Set([
  'http://www.yohunderground.fun',
  'https://www.yohunderground.fun',
]);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      // Allow requests like Postman, curl, or mobile apps
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, origin); // Reflect the matched origin
    }

    console.warn(`❌ CORS Rejected: ${origin}`);
    return callback(new Error('CORS: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204, // For legacy browsers
};

app.use(cors(corsOptions));
app.use(express.json());
