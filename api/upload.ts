import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({});
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Error processing file upload' });
      }

      const file = files.file?.[0];
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Process the file here
      // For example, save it to a temporary location or process it directly

      res.status(200).json({ message: 'File uploaded successfully' });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
}
