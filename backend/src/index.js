const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const { sequelize } = require('./models');
const apiRoutes = require('./routes/api');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRoutes);

// basic health
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`FeedSawa backend running on ${PORT}`));
}).catch(err => {
  console.error('DB sync failed', err);
});
