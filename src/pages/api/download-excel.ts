import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const filePath = path.join(process.cwd(), 'public', 'Project Performance Template.xlsx');

  try {
    const fileData = fs.readFileSync(filePath);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Project Performance Template.xlsx`);
    res.send(fileData);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
}