const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Notification', {
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: DataTypes.STRING,
  message: DataTypes.STRING,
  read: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });
