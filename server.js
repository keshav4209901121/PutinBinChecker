const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// BIN checker API route
app.get('/api/bin/:bin', async (req, res) => {
  try {
    const { bin } = req.params;
    
    // Validate BIN format
    if (!bin || !/^\d{6,8}$/.test(bin)) {
      return res.status(400).json({ 
        error: "Invalid BIN format. BIN must be 6-8 digits." 
      });
    }

    // Fetch from external API
    const response = await fetch(`https://grandpaachk.xyz/public/v1/bininfo/bin.php?bin=${bin}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ 
          error: "BIN not found" 
        });
      }
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.bin) {
      return res.status(404).json({ 
        error: "BIN not found" 
      });
    }

    res.json(data);
  } catch (error) {
    console.error("BIN API error:", error);
    res.status(500).json({ 
      error: "Failed to fetch BIN information" 
    });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`PUTIN BIN CHECKER running on port ${port}`);
});
