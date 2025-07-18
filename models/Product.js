const { DataTypes } = require('sequelize');
const sequelize = require('/app/db.js');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    imageFile: {
        type: DataTypes.BLOB('long'),
        allowNull: true,
        get() {
            const data = this.getDataValue('imageFile');
            return data ? data.toString('base64') : null;
        }
    }
});

module.exports = Product;
