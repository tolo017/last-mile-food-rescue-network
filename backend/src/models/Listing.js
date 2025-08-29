const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Listing', {
  id: { type: DataTypes.STRING, primaryKey: true },
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  priceCents: DataTypes.INTEGER,
  vendorId: DataTypes.STRING,
  sponsored: { type: DataTypes.BOOLEAN, defaultValue: false },
  promotedUntil: DataTypes.DATE
}, { timestamps: true });
