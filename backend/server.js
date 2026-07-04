require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '*';

// Middleware
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/cases',   require('./routes/cases'));
app.use('/api/suspects',require('./routes/suspects'));
app.use('/api/evidence', require('./routes/evidence'));
app.use('/api/graph',   require('./routes/graph'));
app.use('/api/ai',      require('./routes/ai'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Justice AI API running' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    await sequelize.sync({ alter: true });
    console.log('✅ Models synced');
    app.listen(PORT, () => console.log(`🚀 Justice AI Server running on port ${PORT}`));
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
