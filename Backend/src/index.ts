import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import loanRoutes from './routes/loanRoutes';
import summaryRoutes from './routes/summaryRoutes';

dotenv.config();

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'MiniLedger API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/summary', summaryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] MiniLedger backend running on port ${PORT}`);
});
