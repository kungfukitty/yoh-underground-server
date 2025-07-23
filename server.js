import express from 'express';
import cors from 'cors';
import memberRoutes from './routes/memberRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/member', memberRoutes);

app.get('/', (req, res) => res.send('API is running...'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
