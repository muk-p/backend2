const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Product = sequelize.define('Product', {
  name: DataTypes.STRING,
  price: DataTypes.FLOAT,
  description: DataTypes.TEXT,
  category: DataTypes.STRING,
  inStock: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = Product;
