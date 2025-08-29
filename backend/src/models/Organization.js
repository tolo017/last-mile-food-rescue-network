const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Organization', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: DataTypes.STRING,
  address: DataTypes.STRING,
  contact_phone: DataTypes.STRING,
  verified: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });
