const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Impact', {
  id: { type: DataTypes.STRING, primaryKey: true },
  pickupId: DataTypes.STRING,
  kgDiverted: DataTypes.FLOAT,
  mealsEstimated: DataTypes.INTEGER,
  donorId: DataTypes.STRING,
  organizationId: DataTypes.STRING
}, { timestamps: true });
