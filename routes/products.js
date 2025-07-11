// File: routes/products.js
const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/upload');
const router = express.Router();
const fs= require('fs');
const path = require('path'); 


// ✅ GET all products
router.get('/',  (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// ✅ POST: Add new product (admin only)
router.post('/', verifyToken, upload.single('image'), (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }

  const { name, description, price, stock } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!name || !price || !stock) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const query = `
    INSERT INTO products (name, description, price, stock, image)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [name, description, price, stock, image], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ message: 'Product added' });
  });
});

// ✅ PUT: Update product stock (admin/worker)
router.put('/:id', verifyToken, upload.single('image'), (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const productId = req.params.id;
  const { name, description, price, stock } = req.body;

  // First, fetch existing product to get old image filename
  db.query('SELECT image FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ message: 'Product not found' });

    const oldImage = results[0].image;
    const newImage = req.file ? req.file.filename : oldImage;

    // Update query, set new image if uploaded
    const query = `UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image = ? WHERE id = ?`;
    db.query(query, [name, description, price, stock, newImage, productId], (err2) => {
      if (err2) return res.status(500).json(err2);

      // If image changed and old image exists, delete old file
      if (req.file && oldImage) {
        const oldImagePath = path.join(__dirname, '../uploads', oldImage);
        fs.unlink(oldImagePath, (unlinkErr) => {
          if (unlinkErr) console.error('Failed to delete old image:', unlinkErr);
        });
      }

      res.json({ message: 'Product updated' });
    });
  });
});

// ✅ DELETE: Remove product (admin only)
router.delete('/:id', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const getQuery = 'SELECT image FROM products WHERE id = ?';
  db.query(getQuery, [req.params.id], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ message: 'Product not found' });

    const image = results[0].image;
    const deleteQuery = 'DELETE FROM products WHERE id = ?';

    db.query(deleteQuery, [req.params.id], (err) => {
      if (err) return res.status(500).json(err);

      if (image) {
        const imagePath = path.join(__dirname, '..', 'uploads', image);
        fs.unlink(imagePath, (fsErr) => {
          if (fsErr && fsErr.code !== 'ENOENT') console.error('Error deleting image:', fsErr);
        });
      }

      res.json({ message: 'Product deleted successfully' });
    });
  });
});

module.exports = router;
