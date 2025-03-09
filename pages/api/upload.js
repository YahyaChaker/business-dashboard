import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { uploadFile } from '../../lib/onedrive-service';

// Disable body parsing, we'll handle it with formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('Upload API handler called, method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        return res.status(500).json({ error: 'Error parsing form data' });
      }

      console.log('Form parsed successfully, files:', files);
      
      if (!files.file || !files.file[0]) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = files.file[0];
      console.log('Reading file from path:', file.filepath);
      
      try {
        const fileBuffer = await fs.promises.readFile(file.filepath);
        const fileName = file.originalFilename;
        
        console.log(`File read successfully: ${fileName}, size: ${fileBuffer.length} bytes`);
        
        // Use our upload service
        const filePath = await uploadFile(fileBuffer, fileName, 'excel');
        
        console.log('Upload successful, file path:', filePath);
        
        return res.status(200).json({ 
          success: true, 
          filePath: filePath 
        });
      } catch (readError) {
        console.error('File reading/upload error:', readError);
        return res.status(500).json({ error: 'Error reading or uploading file' });
      }
    });
  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
