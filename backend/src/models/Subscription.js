const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Subscription', {
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: DataTypes.STRING,
  plan: DataTypes.STRING, // free, pro, org
  status: DataTypes.STRING, // active, cancelled
  startedAt: DataTypes.DATE,
  expiresAt: DataTypes.DATE
}, { timestamps: true });
