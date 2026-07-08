import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import macroGoalsRouter from './routes/macroGoals.js';
import microTasksRouter from './routes/microTasks.js';
import schedulerRouter from './routes/scheduler.js';
import closeoutsRouter from './routes/closeouts.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/macro-goals', macroGoalsRouter);
app.use('/api/micro-tasks', microTasksRouter);
app.use('/api/scheduler', schedulerRouter);
app.use('/api/close-day', closeoutsRouter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
