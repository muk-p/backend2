const express = require('express');
const router = express.Router();
const db = require('../db'); // your MySQL connection pool

router.post('/', async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty cart' });
  }

  // Start transaction
  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: 'Transaction error' });

    let total = 0;

    const getProduct = (id) => new Promise((resolve, reject) => {
      db.query('SELECT * FROM products WHERE id = ?', [id], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });

    const updateStock = (id, qty) => new Promise((resolve, reject) => {
      db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, id], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const insertOrder = (total) => new Promise((resolve, reject) => {
      db.query('INSERT INTO orders (total) VALUES (?)', [total], (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });

    const insertOrderItem = (orderId, productId, qty, price) => new Promise((resolve, reject) => {
      db.query('INSERT INTO order_items (order_id, product_id, qty, price) VALUES (?, ?, ?, ?)',
        [orderId, productId, qty, price], (err) => {
          if (err) return reject(err);
          resolve();
        });
    });

    (async () => {
      try {
        for (const item of items) {
          const product = await getProduct(item.id);
          if (!product || product.stock < item.qty) {
            throw new Error(`Insufficient stock for ${product?.name || 'product'}`);
          }
          total += item.qty * product.price;
        }

        const orderId = await insertOrder(total);

        for (const item of items) {
          const product = await getProduct(item.id);
          await updateStock(item.id, item.qty);
          await insertOrderItem(orderId, item.id, item.qty, product.price);
        }

        db.commit(err => {
          if (err) {
            db.rollback(() => res.status(500).json({ error: 'Commit failed' }));
          } else {
            res.status(201).json({ message: 'Order placed', orderId });
          }
        });
      } catch (err) {
        db.rollback(() => res.status(400).json({ error: err.message }));
      }
    })();
  });
});

module.exports = router;

