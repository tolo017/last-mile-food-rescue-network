const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite:./db/feed_sawa.sqlite', { logging: false });

const User = require('./User')(sequelize);
const Organization = require('./Organization')(sequelize);
const Pickup = require('./Pickup')(sequelize);

// associations
Organization.hasMany(Pickup, { foreignKey: 'organizationId' });
Pickup.belongsTo(Organization, { foreignKey: 'organizationId' });

module.exports = { sequelize, User, Organization, Pickup };
