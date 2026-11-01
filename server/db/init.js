// db/init.js

const { Client } = require('pg');

const client = new Client({
    user: 'yourUsername',
    host: 'localhost',
    database: 'yourDatabase',
    password: 'yourPassword',
    port: 5432,
});

const initializeDatabase = async () => {
    await client.connect();

    try {
        await client.query("CREATE TABLE IF NOT EXISTS users (\n            id SERIAL PRIMARY KEY,\n            username VARCHAR(50) NOT NULL,\n            email VARCHAR(100) UNIQUE NOT NULL,\n            password VARCHAR(100) NOT NULL,\n            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n        );");

        await client.query("CREATE TABLE IF NOT EXISTS tenders (\n            id SERIAL PRIMARY KEY,\n            title VARCHAR(255) NOT NULL,\n            description TEXT,\n            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n            user_id INTEGER REFERENCES users(id)\n        );");

        await client.query("CREATE TABLE IF NOT EXISTS bids (\n            id SERIAL PRIMARY KEY,\n            tender_id INTEGER REFERENCES tenders(id),\n            user_id INTEGER REFERENCES users(id),\n            amount DECIMAL NOT NULL,\n            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n        );");

        await client.query("CREATE TABLE IF NOT EXISTS payments (\n            id SERIAL PRIMARY KEY,\n            user_id INTEGER REFERENCES users(id),\n            tender_id INTEGER REFERENCES tenders(id),\n            amount DECIMAL NOT NULL,\n            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n        );");

        await client.query("CREATE TABLE IF NOT EXISTS notifications (\n            id SERIAL PRIMARY KEY,\n            user_id INTEGER REFERENCES users(id),\n            message TEXT NOT NULL,\n            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n        );");

        console.log('Database initialized successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await client.end();
    }
};

initializeDatabase();
