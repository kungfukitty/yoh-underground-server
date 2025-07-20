// File: server.js
// ... other imports ...
import authRoutes from './routes/authRoutes.js';
app.use('/api/auth', authRoutes);

// Comment these out:
// import memberRoutes from './routes/memberRoutes.js';
// app.use('/api/member', memberRoutes);
// import eventRoutes from './routes/eventRoutes.js';
// app.use('/api/events', eventRoutes);
// import adminRoutes from './routes/adminRoutes.js';
// app.use('/api/admin', adminRoutes);
// ... rest of server.js
