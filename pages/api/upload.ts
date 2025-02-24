import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ message: 'Error parsing file upload' });
      }

      if (!files.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const file = files.file[0];
      const publicDir = path.join(process.cwd(), 'public');
      const destinationPath = path.join(publicDir, 'Project Performance Template.xlsx');

      // Create public directory if it doesn't exist
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Copy the file to the public directory
      fs.copyFileSync(file.filepath, destinationPath);

      // Clean up the temporary file
      fs.unlinkSync(file.filepath);

      res.status(200).json({ message: 'File uploaded successfully' });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
}
