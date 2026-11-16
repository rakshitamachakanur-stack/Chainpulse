const express = require('express');
const http    = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const httpServer = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: /^http:\/\/localhost:\d+$/,
    methods: ['GET','POST'],
    credentials: true,
  },
  transports: ['websocket','polling'],
});

// Attach io to app so controllers can emit
app.set('io', io);

io.on('connection', socket => {
  console.log(`⚡ WS connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`⚡ WS disconnected: ${socket.id}`));
});

// Periodic live shipment movement simulator (every 8s)
setInterval(async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const Shipment = mongoose.model('Shipment');
    const active = await Shipment.find({ status: { $in: ['in_transit', 'out_for_delivery'] } });
    if (!active || !active.length) return;

    for (const s of active) {
      if (!s.destination?.lat || !s.currentLocation?.lat) continue;
      const dLat = s.destination.lat - s.currentLocation.lat;
      const dLng = s.destination.lng - s.currentLocation.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist > 0.03) {
        // Move 4% closer towards destination
        s.currentLocation.lat += dLat * 0.04;
        s.currentLocation.lng += dLng * 0.04;
        s.currentLocation.updatedAt = new Date();
        await s.save();
      }

      io.emit('shipment:location', {
        id: s._id,
        trackingNumber: s.trackingNumber,
        carrier: s.carrier,
        driver: s.driver,
        status: s.status,
        currentLocation: s.currentLocation,
        origin: s.origin,
        destination: s.destination,
        speed: Math.floor(55 + Math.random() * 12)
      });
    }
  } catch (err) {
    // Non-critical simulation tick
  }
}, 8000);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15*60*1000, max: 500 }));

// ── CORS — accept all localhost origins in dev ────────────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (Postman, curl, same-origin proxy)
    if (!origin) return callback(null, true);
    // Allow any localhost port in development
    if (origin.match(/^http:\/\/localhost:\d+$/)) return callback(null, true);
    // Allow any 127.0.0.1 port
    if (origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) return callback(null, true);
    // Production: check explicit list
    const allowed = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.ADMIN_URL    || 'http://localhost:3001',
    ];
    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
}));

// Handle preflight for all routes
app.options('*', cors());

app.use(express.json({ limit:'10mb' }));
app.use(express.urlencoded({ extended:true }));

// ── Database ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chainpulse2')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(e => { console.error('❌ MongoDB:', e.message); process.exit(1); });

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/suppliers',     require('./routes/suppliers'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/requisitions',  require('./routes/requisitions'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/inventory',     require('./routes/inventory'));
app.use('/api/receipts',      require('./routes/receipts'));
app.use('/api/shipments',     require('./routes/shipments'));
app.use('/api/vehicles',      require('./routes/vehicles'));
app.use('/api/deliveries',    require('./routes/deliveries'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/api/admin',         require('./routes/admin'));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'ChainPulse 2.0 running', timestamp: new Date() })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
module.exports = app;
