const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID || 'unknown';

app.get('/', (req, res) => {
  res.json({
    server: SERVER_ID,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: SERVER_ID
  });
});

app.listen(PORT, () => {
  console.log(`Server ${SERVER_ID} listening on port ${PORT}`);
});
