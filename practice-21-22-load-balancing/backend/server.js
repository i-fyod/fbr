const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

// Уникальный идентификатор сервера для отслеживания балансировки
const SERVER_ID = process.env.SERVER_ID || `server-${PORT}`;

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Load Balanced Backend',
    server_id: SERVER_ID,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server_id: SERVER_ID,
    port: PORT,
    uptime: process.uptime()
  });
});

app.get('/api/test', (req, res) => {
  // Имитация небольшой задержки для теста
  const delay = Math.random() * 100;
  setTimeout(() => {
    res.json({
      data: 'Test response',
      server_id: SERVER_ID,
      port: PORT,
      delay_ms: delay
    });
  }, delay);
});

app.listen(PORT, () => {
  console.log(`Backend server ${SERVER_ID} running on port ${PORT}`);
});
