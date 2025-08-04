// server.js (excerpt)

import express from 'express';
import cors    from 'cors';
import './config/firebaseAdminInit.js';
import dotenv  from 'dotenv';
dotenv.config();

const app = express();

// VERY PERMISSIVE for now—allow any origin, including your FreeHostia site
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
app.options('*', cors()); // make sure preflight is handled

// ...mount routes as before...
