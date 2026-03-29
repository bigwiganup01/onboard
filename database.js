const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function initDB() {
    const db = await open({
        filename: process.env.DB_PATH || './database.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            whatsapp TEXT UNIQUE NOT NULL,
            platformId TEXT UNIQUE NOT NULL,
            aadhar TEXT UNIQUE NOT NULL,
            pan TEXT UNIQUE NOT NULL,
            amount REAL NOT NULL,
            transactionId TEXT NOT NULL,
            paymentMethod TEXT NOT NULL,
            receiptPath TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    return db;
}

module.exports = { initDB };