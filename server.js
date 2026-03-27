require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto'); // Import crypto module
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
    if (!text) return '';
    try {
        // Convert keys from base64 to Buffers and validate lengths
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
        const iv = Buffer.from(process.env.ENCRYPTION_IV, 'base64');

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    } catch (err) {
        throw new Error(`Encryption failed: ${err.message}. Ensure ENCRYPTION_KEY is 32 bytes and ENCRYPTION_IV is 16 bytes when decoded.`);
    }
}

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database');
});

app.post('/contact', (req, res) => { // Changed route to /contact as per previous diff
    const { userName, email, message } = req.body;
    
    // Encrypt the sensitive data
    const encryptedUserName = encrypt(userName);
    const encryptedEmail = encrypt(email);
    const encryptedMessage = encrypt(message);
    const userId = Math.floor(Math.random() * 1000000); // Generate a random UserID (not stored in DB, just for logging)

    console.log('UserId:', userId);
    console.log('Encrypted UserName:', encryptedUserName);
    console.log('Encrypted Email:', encryptedEmail);
    console.log('Encrypted Message:', encryptedMessage);


    const query = 'INSERT INTO Contact_data (UserID, UserName, Email, Message) VALUES (?, ?, ?, ?)';
    db.query(query, [userId, encryptedUserName, encryptedEmail, encryptedMessage], (err, result) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        // Alert the user and redirect back to the home page's contact section
        res.send(`<script>alert('Thanks ${userName}, your message has been sent!'); window.location.href='/#contact';</script>`);
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));