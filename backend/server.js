import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './config/db.js';
import errorHandler from './middleware/error.js';
import Food from './models/Food.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
import authRoutes from './routes/auth.js';
import foodRoutes from './routes/food.js';
import uploadRoutes from './routes/uploadRoute.js';
import messageRoutes from './routes/messages.js';
import communicationRoutes from './routes/communication.js';

const app = express();

// Security middleware - Set security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Cookie parser
app.use(cookieParser());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize data - prevent NoSQL injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Prevent http param pollution
app.use(hpp());

// General rate limiting - More lenient in development, strict in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // 100 in production, 500 in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Enable CORS - Improved with deterministic allowlist
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://foodshare-mern.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    }
  },
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200, // For legacy browser support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // Cache preflight for 24 hours
};

app.use(cors(corsOptions));

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Make io instance available to controllers via app.locals
app.locals.io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New socket client connected:', socket.id);

  // Handle user authentication for socket
  socket.on('authenticate', async (userId) => {
    try {
      // Import User model dynamically to avoid circular dependency
      const { default: User } = await import('./models/User.js');
      const user = await User.findById(userId);
      
      if (user) {
        socket.userId = userId;
        socket.userRole = user.role;
        
        // Join user-specific room
        socket.join(`user_${userId}`);
        
        // Join role-based room
        socket.join(`role_${user.role}`);
        
        console.log(`User ${userId} (${user.role}) authenticated and joined rooms`);
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
    }
  });

  // Chat events
  socket.on('joinConversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('leaveConversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  socket.on('typing', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('userTyping', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });

  socket.on('stopTyping', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('userStoppedTyping', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/communication', communicationRoutes);

// Cron job to expire old food posts - runs daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('Running cron job to expire old food posts...');
    const now = new Date();
    
    const result = await Food.updateMany(
      {
        claimStatus: { $in: ['available', 'claimed'] },
        $or: [
          { expiryDate: { $lt: now } },
          { 'pickupTiming.endTime': { $lt: now } }
        ]
      },
      {
        $set: { claimStatus: 'expired' }
      }
    );
    
    console.log(`Expired ${result.modifiedCount} food posts`);
  } catch (error) {
    console.error('Error running expiry cron job:', error);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FoodShare API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;
