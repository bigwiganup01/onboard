require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const basicAuth = require('express-basic-auth');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

const { initDB } = require('./database');
const { sendNotificationEmail } = require('./mailer');

const app = express();
let db;

// 1. SECURITY & MIDDLEWARE
app.use(helmet()); 
app.use(express.json());
app.use(express.static('public')); // Serves your HTML/JS/CSS

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 20, // Increased slightly to account for validation pings + submission
    message: "Too many requests, please try again later."
});

// 2. FILE UPLOAD CONFIG
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// --- API ROUTES ---

// Brand Config
app.get('/api/config', (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync('./brandconfig.json', 'utf8'));
        res.json(config);
    } catch (e) { res.status(500).json({error: "Config missing"}); }
});

// Real-time Validation
app.get('/api/validate', async (req, res) => {
    try {
        const { field, value } = req.query;
        const allowedFields = ['email', 'whatsapp', 'platformId', 'aadhar', 'pan'];
        
        if (!allowedFields.includes(field)) return res.status(400).json({ error: "Invalid field" });

        const existing = await db.get(`SELECT ${field} FROM users WHERE ${field} = ?`, [value]);
        if (existing) {
            return res.json({ exists: true, message: `The mentioned ${field.toUpperCase()} already exists in our database.` });
        }
        res.json({ exists: false });
    } catch (error) { res.status(500).json({ error: "Validation failed" }); }
});

// Main Onboarding
app.post('/api/onboard', apiLimiter, upload.single('receipt'), async (req, res) => {
    const data = req.body;
    try {
        // Precise duplicate check
        const fieldsToCheck = ['email', 'whatsapp', 'platformId', 'aadhar', 'pan'];
        for (let field of fieldsToCheck) {
            const check = await db.get(`SELECT ${field} FROM users WHERE ${field} = ?`, [data[field]]);
            if (check) {
                if (req.file) fs.unlinkSync(req.file.path); // Delete receipt
                return res.status(409).json({ error: `The ${field.toUpperCase()} already exists.` });
            }
        }

        // Insert
        await db.run(`
            INSERT INTO users (firstName, lastName, email, whatsapp, platformId, aadhar, pan, amount, transactionId, paymentMethod, receiptPath)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [data.firstName, data.lastName, data.email, data.whatsapp, data.platformId, data.aadhar, data.pan, data.amount, data.transactionId, data.paymentMethod, req.file.path]);

        await sendNotificationEmail(data, req.file);
        res.status(201).json({ message: "Registration successful." });

    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: "Submission failed." });
    }
});

// --- ADMIN ROUTES ---
const adminAuth = basicAuth({
    users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
    challenge: true
});

app.get('/admin/exportdb', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = 'SELECT * FROM users';
        let params = [];

        if (startDate && endDate) {
            query += ' WHERE createdAt BETWEEN ? AND ?';
            params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
        }

        const users = await db.all(query, params);
        if (users.length === 0) return res.send('No records.');

        const csv = new Parser().parse(users);
        res.header('Content-Type', 'text/csv').attachment(`export_${Date.now()}.csv`).send(csv);
    } catch (error) { res.status(500).send("Export failed."); }
});

// --- STARTUP ---
initDB().then(database => {
    db = database;
    if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
});

app.get('/api/validate', async (req, res) => {
    try {
        const { field, value } = req.query;
        
        // Pretty name mapping for backend messages
        const names = { email: "Email", whatsapp: "WhatsApp", platformId: "User ID", aadhar: "Aadhaar", pan: "PAN" };

        const existing = await db.get(`SELECT ${field} FROM users WHERE ${field} = ?`, [value]);

        if (existing) {
            const displayName = names[field] || field;
            return res.json({ 
                exists: true, 
                message: `The mentioned ${displayName} already exists in our database.` 
            });
        }

        res.json({ exists: false });
    } catch (error) {
        res.status(500).json({ error: "Validation failed" });
    }
});