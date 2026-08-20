const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/menu - returns entire menu tree structure
router.get('/', async (req, res) => {
  try {
    // 1. Get version
    const versionRes = await db.query('SELECT version, updated_at FROM menu_version WHERE id = 1');
    const versionData = versionRes.rows[0] || { version: 1, updated_at: new Date() };

    // 2. Get categories
    const categoriesRes = await db.query('SELECT * FROM categories ORDER BY sort_order ASC');
    const categoriesMap = {};
    categoriesRes.rows.forEach(c => {
      categoriesMap[c.id] = {
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        iconSvg: c.icon_svg
      };
    });

    // 3. Get items
    const itemsRes = await db.query('SELECT * FROM items ORDER BY sort_order ASC');
    const itemsList = itemsRes.rows.map(i => ({
      id: i.id,
      categoryId: i.category_id,
      title: i.title,
      description: i.description,
      price: parseFloat(i.price),
      image: i.image,
      available: i.available
    }));

    res.json({
      version: versionData.version,
      updatedAt: versionData.updated_at,
      categories: categoriesMap,
      items: itemsList
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu data' });
  }
});

module.exports = router;
