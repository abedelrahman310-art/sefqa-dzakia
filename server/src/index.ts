import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load root .env explicitly (server runs from server/, .env is at repo root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import { healthRouter } from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use('/api', healthRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
