import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  const connection = mysql.createPool({
    uri: process.env.DATABASE_URL,
  });
  _db = drizzle(connection);
  return _db;
}
