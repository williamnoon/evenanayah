const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// QuranHub MCP Server proxy endpoint
app.post('/api/quran', async (req, res) => {
  try {
    const { tool, params } = req.body;

    // Call QuranHub MCP Server
    const response = await fetch('https://mcp.quranhub.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: tool,
          arguments: params || {}
        }
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('QuranHub API Error:', error);
    res.status(500).json({ error: 'Failed to fetch from QuranHub' });
  }
});

// Direct API calls to QuranHub for simpler operations
app.get('/api/surah/:number', async (req, res) => {
  try {
    const surahNumber = req.params.number;
    const edition = req.query.edition || 'quran-uthmani';

    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${edition}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Surah fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch surah' });
  }
});

app.get('/api/ayah/:reference', async (req, res) => {
  try {
    const reference = req.params.reference;
    const editions = req.query.editions || 'quran-uthmani,en.sahih';

    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${reference}/editions/${editions}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Ayah fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch ayah' });
  }
});

app.get('/api/audio/:reference', async (req, res) => {
  try {
    const reference = req.params.reference;
    const reciter = req.query.reciter || 'ar.alafasy';

    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${reference}/${reciter}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Audio fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch audio' });
  }
});

app.get('/api/surahs', async (req, res) => {
  try {
    const response = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Surahs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch surahs list' });
  }
});

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Even an Ayah server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
