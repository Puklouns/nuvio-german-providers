const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Raddon Manifest für Nuvio
app.get('/manifest.json', (req, res) => {
  const manifestPath = path.join(process.cwd(), 'manifest.json');
  fs.readFile(manifestPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Manifest nicht gefunden' });
    
    let manifest = JSON.parse(data);
    manifest.resources = ["stream"];
    manifest.types = ["movie", "series"];
    
    res.setHeader('Content-Type', 'application/json');
    res.json(manifest);
  });
});

// 2. Stream-Endpoint für Scraper
app.get('/stream/:type/:id.json', async (req, res) => {
  const { type, id } = req.params;
  console.log(`[Raddon] Anfrage erhalten für Type: ${type}, ID: ${id}`);

  let streams = [];

  try {
    const providersDir = path.join(process.cwd(), 'providers');
    if (fs.existsSync(providersDir)) {
      const files = fs.readdirSync(providersDir).filter(file => file.endsWith('.js'));

      for (const file of files) {
        try {
          const providerPath = path.join(providersDir, file);
          delete require.cache[require.resolve(providerPath)];
          const provider = require(providerPath);

          if (typeof provider.getStreams === 'function') {
            const results = await provider.getStreams(type, id);
            if (Array.isArray(results)) {
              streams.push(...results);
            }
          }
        } catch (pErr) {
          console.error(`Fehler bei Scraper ${file}:`, pErr.message);
        }
      }
    }
    res.json({ streams });
  } catch (err) {
    console.error('Server-Fehler:', err);
    res.json({ streams: [] });
  }
});

app.get('/', (req, res) => {
  res.send('Nuvio German Raddon Server auf Vercel läuft!');
});

// WICHTIG für Vercel: App exportieren
module.exports = app;
