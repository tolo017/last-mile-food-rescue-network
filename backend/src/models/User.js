const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: DataTypes.STRING,
    role: DataTypes.ENUM('donor','charity','volunteer','admin'),
    phone: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    passwordHash: DataTypes.STRING,
    reputationScore: { type: DataTypes.FLOAT, defaultValue: 0 },
    locationLat: DataTypes.FLOAT,
    locationLng: DataTypes.FLOAT
  }, { timestamps: true });

  User.prototype.setPassword = async function(password) {
    this.passwordHash = await bcrypt.hash(password, 10);
  };

  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.passwordHash || '');
  };

  return User;
};

