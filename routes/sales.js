const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');
const verifyRole = require('../middleware/verifyRole');
const router = express.Router();

// Get all sales
router.get('/', verifyToken, (req, res) => {
  const query = `
    SELECT s.*, p.name AS product_name FROM sales s
    JOIN products p ON s.product_id = p.id
    ORDER BY s.timestamp DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Record a sale
router.post('/', verifyToken, (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  // First check and update stock
  const stockCheckQuery = 'SELECT stock FROM products WHERE id = ?';
  db.query(stockCheckQuery, [productId], (err, result) => {
    if (err || result.length === 0) return res.status(500).json({ message: 'Product not found' });

    const currentStock = result[0].stock;
    if (currentStock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }

    const newStock = currentStock - quantity;
    const updateStockQuery = 'UPDATE products SET stock = ? WHERE id = ?';

    db.query(updateStockQuery, [newStock, productId], (err) => {
      if (err) return res.status(500).json(err);

      const insertSaleQuery = 'INSERT INTO sales (product_id, quantity) VALUES (?, ?)';
      db.query(insertSaleQuery, [productId, quantity], (err) => {
        if (err) return res.status(500).json(err);

        if (newStock === 0) {
          const deleteProductQuery = 'DELETE FROM products WHERE id = ?';
          db.query(deleteProductQuery, [productId], (err) => {
            if (err) console.error('Failed to delete out-of-stock product:', err);
          });
        }

        res.status(201).json({ message: 'Sale recorded' });
      });
    });
  });
});

// Sales report
router.get('/report', verifyToken, verifyRole(['admin']), (req, res) => {

  const breakdownQuery = `
    SELECT 
      p.name AS product_name,
      SUM(s.quantity) AS total_quantity,
      SUM(s.quantity * p.price) AS total_revenue
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY s.product_id, p.name
  `;

  const dailyQuery = `
    SELECT 
      DATE(s.timestamp) AS date,
      SUM(s.quantity * p.price) AS total_sales
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY DATE(s.timestamp)
    ORDER BY DATE(s.timestamp)
  `;

  db.query(breakdownQuery, (err, breakdownResults) => {
    if (err) return res.status(500).json(err);

    const totalSales = breakdownResults.reduce((sum, r) => sum + r.total_revenue, 0);

    db.query(dailyQuery, (err, dailyResults) => {
      if (err) return res.status(500).json(err);

      res.json({
        totalSales,
        breakdown: breakdownResults,
        daily: dailyResults
      });
    });
  });
});

module.exports = router;
