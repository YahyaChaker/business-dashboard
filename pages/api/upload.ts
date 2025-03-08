// File: /pages/api/upload.js (or .ts)
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const form = new IncomingForm();
  
  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ message: 'Error uploading file' });
    }
    
    // Get the file from the 'file' field
    const file = files.file;
    if (!file || !file[0]) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    try {
      const filePath = file[0].filepath;
      const destinationPath = path.join(process.cwd(), 'public', 'Project Performance Template.xlsx');
      
      // Read the uploaded file
      const data = fs.readFileSync(filePath);
      
      // Write to destination
      fs.writeFileSync(destinationPath, data);
      
      // Clean up temp file
      fs.unlinkSync(filePath);
      
      return res.status(200).send({ message: 'File uploaded successfully' });
    } catch (error) {
      console.error('Error handling file:', error);
      return res.status(500).json({ message: 'Error processing file' });
    }
  });
}