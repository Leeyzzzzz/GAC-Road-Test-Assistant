require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/projects', require('./routes/projects'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/records', require('./routes/records'));
app.use('/api/export', require('./routes/export'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize DB and start server
initDB();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`路测助手服务运行在 http://localhost:${PORT}`);
  });
}

module.exports = app;
