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

// Serve admin panel files
app.use('/admin', express.static(path.join(__dirname, '../Admin')));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database');
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

function decrypt(text) {
    if (!text) return '';

    // Basic validation: Encrypted hex strings must be even length and 
    // at least 32 characters long for a single AES block.
    const isHex = /^[0-9a-fA-F]+$/.test(text);
    if (!isHex || text.length % 2 !== 0 || text.length < 32) {
        return text; // Return as is (likely plain text)
    }

    try {
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
        const iv = Buffer.from(process.env.ENCRYPTION_IV, 'base64');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(text, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        // Fallback for legacy data that looks like hex but isn't ciphertext
        return text;
    }
}

app.get('/api/admin/db-status', (req, res) => {
    db.query('SELECT 1', (err) => {
        if (err) {
            return res.json({ status: 'not connected' });
        }
        res.json({ status: 'connected' });
    });
});

app.get('/api/admin/messages', (req, res) => {
    const query = 'SELECT * FROM Contact_data ORDER BY CreatedAt DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        const decryptedResults = results.map(row => ({
            id: row.UserID,
            userName: decrypt(row.UserName),
            email: decrypt(row.Email),
            message: decrypt(row.Message),
            date: row.CreatedAt
        }));
        res.json(decryptedResults);
    });
});

app.delete('/api/admin/messages/:id', (req, res) => {
    const query = 'DELETE FROM Contact_data WHERE UserID = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Message deleted successfully' });
    });
});

app.post('/contact', (req, res) => { // Changed route to /contact as per previous diff
    const { userName, email, message } = req.body;
    
    // Encrypt the sensitive data
    const encryptedUserName = encrypt(userName);
    const encryptedEmail = encrypt(email);
    const encryptedMessage = encrypt(message);
    const userId = Math.floor(Math.random() * 1000000); // Generate a random UserID

    console.log('UserId:', userId);
    console.log('Encrypted UserName:', encryptedUserName);
    console.log('Encrypted Email:', encryptedEmail);
    console.log('Encrypted Message:', encryptedMessage);


    const query = 'INSERT INTO Contact_data (UserID, UserName, Email, Message, CreatedAt) VALUES (?, ?, ?, ?, NOW())';
    db.query(query, [userId, encryptedUserName, encryptedEmail, encryptedMessage], (err, result) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        // Alert the user and redirect back to the home page's contact section
        res.send(`<script>alert('Thanks ${userName}, your message has been sent!'); window.location.href='/#contact';</script>`);
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));