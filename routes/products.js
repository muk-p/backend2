// File: routes/products.js
const express = require('express');
const Product = require('../models/Product');
const verifyToken = require('../middleware/verifyToken');
const verifyRole = require('../middleware/verifyRole');
const upload = require('../middleware/upload');
const router = express.Router();
const fs= require('fs');
const path = require('path'); 


// ✅ GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ POST: Add new product (admin only)
router.post('/', verifyToken, verifyRole(['admin']), upload.single('image'), async (req, res) => {
  const { name, description, price, stock } = req.body;
  const imageFile = req.file ? req.file.buffer : null;

  if (!name || !price || !stock) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await Product.create({ name, description, price, stock, imageFile });
    res.status(201).json({ message: 'Product added' });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ PUT: Update product stock (admin/worker)
router.put('/:id', verifyToken, verifyRole(['admin']), upload.single('image'), async (req, res) => {
  const productId = req.params.id;
  const { name, description, price, stock } = req.body;

  try {
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const newImageFile = req.file ? req.file.buffer : product.imageFile;

    await product.update({ name, description, price, stock, imageFile: newImageFile });

    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ DELETE: Remove product (admin only)
router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.destroy();

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
