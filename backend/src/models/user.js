const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: DataTypes.STRING,
  role: DataTypes.ENUM('donor','charity','admin'),
  phone: DataTypes.STRING,
  email: DataTypes.STRING
}, { timestamps: true });
