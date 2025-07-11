const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db.js');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
  db.query(query, [username, hashedPassword, role], (err, result) => {
    if (err) return res.status(500).json(err);
    res.status(201).json({ message: 'User registered' });
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(401).json({ message: 'User not found' });

    const user = results[0];
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ token });
  });
});

router.get('/me', verifyToken, (req, res) => {
  const query = 'SELECT id, username, role FROM users WHERE id = ?';
  db.query(query, [req.user.id], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results[0]);
  });
});

module.exports = router;
