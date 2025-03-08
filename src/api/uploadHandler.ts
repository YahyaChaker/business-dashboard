import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
// Remove unused fs import
import * as XLSX from 'xlsx';

// Update the request type to include file property
interface FileRequest extends Request {
  file?: Express.Multer.File;
}

// Set up storage configuration
const storage = multer.diskStorage({
  destination: (_req: Express.Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Configure file filter
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (validExtensions.includes(ext)) {
    return cb(null, true);
  }
  
  return cb(new Error('Only Excel files are allowed!'));
};

const upload = multer({ storage, fileFilter });

const router = express.Router();

// Fix the return type by making the handler async and returning void
router.post('/upload', upload.single('excelFile'), async (req: FileRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Read the uploaded Excel file
    const workbook = XLSX.read(req.file.path, { type: 'file' });
    
    // Process the data here...
    
    // Return success response
    res.status(200).json({ message: 'File uploaded successfully', filename: req.file.filename });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

export default router;