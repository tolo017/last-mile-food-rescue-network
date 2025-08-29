const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite:./db/eco_sawa.sqlite', { logging: false });

const User = require('./User')(sequelize);
const Organization = require('./Organization')(sequelize);
const Pickup = require('./Pickup')(sequelize);
const Subscription = require('./Subscription')(sequelize);
const Listing = require('./Listing')(sequelize);
const Notification = require('./Notification')(sequelize);
const Impact = require('./Impact')(sequelize);

// associations
Organization.hasMany(Pickup, { foreignKey: 'organizationId' });
Pickup.belongsTo(Organization, { foreignKey: 'organizationId' });

User.hasMany(Subscription, { foreignKey: 'userId' });
User.hasMany(Notification, { foreignKey: 'userId' });

module.exports = { sequelize, User, Organization, Pickup, Subscription, Listing, Notification, Impact };
