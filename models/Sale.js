module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define('Sale', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    productId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Products', // table name
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
  });

  return Sale;
};
