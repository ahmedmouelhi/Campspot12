const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Proxy API requests to the actual backend server (running separately)
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.log('Proxy error:', err.message);
    res.status(500).json({ error: 'API server not available' });
  }
}));

// Proxy API docs to the actual backend server
app.use('/api-docs', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.log('Proxy error:', err.message);
    res.status(500).json({ error: 'API server not available' });
  }
}));

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Full-stack app running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔍 Frontend: http://localhost:${PORT}`);
});
