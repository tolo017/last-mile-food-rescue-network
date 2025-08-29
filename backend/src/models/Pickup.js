const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Pickup', {
  id: { type: DataTypes.STRING, primaryKey: true },
  donorName: DataTypes.STRING,
  donorPhone: DataTypes.STRING,
  location: DataTypes.STRING,
  weightKg: DataTypes.FLOAT,
  perishability: DataTypes.ENUM('high','medium','low'),
  status: DataTypes.STRING, // created, booked, enroute, completed, cancelled
  instasendBookingId: DataTypes.STRING,
  platformFeeCents: DataTypes.INTEGER,
  totalFeeCents: DataTypes.INTEGER
}, { timestamps: true });
