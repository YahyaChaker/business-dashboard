import express from 'express';
import formidable from 'formidable';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_DIR = join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/upload', async (req, res) => {
  try {
    const form = formidable({
      uploadDir: UPLOADS_DIR,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'Error processing file upload' });
      }

      const file = files.file?.[0];
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      res.json({ 
        message: 'File uploaded successfully',
        filename: file.newFilename
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
});
