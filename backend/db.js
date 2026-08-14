const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, 'database.sqlite');
const schemaFile = path.join(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.run("PRAGMA foreign_keys = ON;", (err) => {
        if (err) {
            console.error('Error enabling foreign keys:', err.message);
        } else {
            console.log('Foreign keys enforced.');
        }
    });

    const schema = fs.readFileSync(schemaFile, 'utf-8');
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error executing schema:', err.message);
        } else {
            console.log('Database schema initialized.');
        }
    });
}

// Wrapper for promises to easily use async/await
const dbRun = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbGet = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

module.exports = { db, dbRun, dbAll, dbGet };
