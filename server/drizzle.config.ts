import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export default defineConfig({
  schema: '../shared/src/schema/index.ts',
  out: './migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
