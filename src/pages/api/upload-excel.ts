import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, _fields, files) => {
      if (err) {
        return res.status(500).json({ error: err });
      }

      try {
        // Access the first file in the array
        const fileArray = files.file;
        if (!fileArray || fileArray.length === 0) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const file = fileArray[0];
        const filePath = path.join(process.cwd(), 'public', 'Project Performance Template.xlsx');

        // Create a write stream to the destination file
        const writeStream = fs.createWriteStream(filePath);

        // Pipe the uploaded file's read stream to the write stream
        fs.createReadStream(file.filepath).pipe(writeStream);

        // Wait for the write stream to finish
        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', () => resolve());
          writeStream.on('error', (error) => reject(error));
        });

        res.status(200).json({ message: 'File uploaded successfully' });
      } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
      }
    });
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}