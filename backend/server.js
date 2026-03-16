require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const authRoutes   = require('./routes/auth');
const workerRoutes = require('./routes/worker');
const clientRoutes = require('./routes/client');
const mapRoutes    = require('./routes/map');
const chatRoutes   = require('./routes/chat');
const adminRoutes  = require('./routes/admin');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET','POST'] }
});
app.set('io', io);

connectDB();
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth',   authRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/map',    mapRoutes);
app.use('/api/chat',   chatRoutes);
app.use('/api/admin',  adminRoutes);

const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('register', ({ userId, role }) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId; socket.userRole = role;
  });
  socket.on('join_job', (jobId) => socket.join('job_' + jobId));
  socket.on('leave_job', (jobId) => socket.leave('job_' + jobId));
  socket.on('typing', ({ jobId, senderName }) => socket.to('job_' + jobId).emit('user_typing', { senderName }));
  socket.on('stop_typing', ({ jobId }) => socket.to('job_' + jobId).emit('user_stop_typing'));
  socket.on('disconnect', () => { if (socket.userId) onlineUsers.delete(socket.userId); });
});

app.set('notifyUser', (targetUserId, notification) => {
  const sid = onlineUsers.get(targetUserId.toString());
  if (sid) io.to(sid).emit('notification', notification);
});

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ message: err.message || 'Server Error' }); });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
