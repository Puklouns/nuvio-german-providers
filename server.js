const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Statische Bereitstellung der Provider-Dateien
app.use('/providers', express.static(path.join(__dirname, 'providers')));

// Manifest-Endpoint für Nuvio
app.get('/manifest.json', (req, res) => {
  const manifestPath = path.join(__dirname, 'manifest.json');
  fs.readFile(manifestPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Manifest nicht gefunden' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

app.get('/', (req, res) => {
  res.send('Nuvio Raddon Server läuft!');
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
