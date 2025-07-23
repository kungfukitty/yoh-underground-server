import express from 'express';
import cors from 'cors';
import memberRoutes from './routes/memberRoutes.js';
import authRoutes from './routes/authRoutes.js';
import securityRoutes from './routes/securityRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/member', memberRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);

app.get('/', (req, res) => res.send('API is running...'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
