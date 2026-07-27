// Must be the first import: ESM evaluates every import fully before this file's own
// code runs, so `dotenv.config()` called later (even at the top of this file's body)
// would run AFTER config/gemini.js (imported transitively below) already read
// process.env.GEMINI_API_KEY as undefined. This side-effect import guarantees env
// vars are loaded before anything else evaluates.
import 'dotenv/config';

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import mlRoutes from './routes/mlRoutes.js';
import healthUpdateRoutes from './routes/healthUpdateRoutes.js';
import wearableRoutes from './routes/wearableRoutes.js';
import mealPlanRoutes from './routes/mealPlanRoutes.js';
import medicalIntakeRoutes from './routes/medicalIntakeRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
});
app.use(limiter);

// DB Connection
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/health', healthUpdateRoutes);
app.use('/api/wearable', wearableRoutes);
app.use('/api/nutrition', mealPlanRoutes);
app.use('/api/health/intake', medicalIntakeRoutes);

app.get('/api/healthcheck', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), service: 'FitAI Backend API v2' });
});

app.use(errorHandler);

// Socket.IO Events
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client Connected: ${socket.id}`);

  socket.on('workout:start', (data) => {
    io.emit('insight:new', { message: 'User started scheduled session.' });
  });

  socket.on('health:updated', (data) => {
    io.emit('insight:new', { message: 'Health status updated! Workouts rebalanced.' });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[FitAI Backend] v2 Server running on port ${PORT}`);
});
