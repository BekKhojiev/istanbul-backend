require('dotenv').config();
const express = require('express');
const cors = require('cors');

const menuRoutes = require('./routes/menu');
const categoryRoutes = require('./routes/categories');
const itemRoutes = require('./routes/items');

const app = express();

app.use(cors());
app.use(express.json());

const path = require('path');
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
