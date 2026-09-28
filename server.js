const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Raddon Manifest für Nuvio
app.get('/manifest.json', (req, res) => {
  const manifestPath = path.join(__dirname, 'manifest.json');
  fs.readFile(manifestPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Manifest nicht gefunden' });
    
    let manifest = JSON.parse(data);
    // Erweitere das Manifest um Raddon/Stremio Stream-Funktionen
    manifest.resources = ["stream"];
    manifest.types = ["movie", "series"];
    
    res.setHeader('Content-Type', 'application/json');
    res.json(manifest);
  });
});

// 2. Stream-Endpoint: Nimmt Anfragen von tvOS entgegen und führt Scraper serverseitig aus
app.get('/stream/:type/:id.json', async (req, res) => {
  const { type, id } = req.params;
  console.log(`[Raddon] Anfrage erhalten für Type: ${type}, ID: ${id}`);

  let streams = [];

  try {
    const providersDir = path.join(__dirname, 'providers');
    const files = fs.readdirSync(providersDir).filter(file => file.endsWith('.js'));

    // Schleife durch alle Provider-Scraper auf dem Server
    for (const file of files) {
      try {
        const providerPath = path.join(providersDir, file);
        delete require.cache[require.resolve(providerPath)]; // Cache leeren
        const provider = require(providerPath);

        // Falls der Provider eine getStreams/extract-Funktion exportiert, führe sie aus
        if (typeof provider.getStreams === 'function') {
          const results = await provider.getStreams(type, id);
          if (Array.isArray(results)) {
            streams.push(...results);
          }
        }
      } catch (pErr) {
        console.error(`Fehler beim Ausführen von Scraper ${file}:`, pErr.message);
      }
    }

    res.json({ streams });
  } catch (err) {
    console.error('Server-Fehler:', err);
    res.json({ streams: [] });
  }
});

// Hauptseite / Healthcheck
app.get('/', (req, res) => {
  res.send('Nuvio German Raddon Server läuft erfolgreich!');
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
