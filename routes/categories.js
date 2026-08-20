const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Helper to bump version
async function bumpVersion() {
  await db.query('UPDATE menu_version SET version = version + 1, updated_at = NOW() WHERE id = 1');
}

// Create category
router.post('/', requireAdmin, async (req, res) => {
  const { id, title, subtitle, description, iconSvg, sortOrder } = req.body;
  
  try {
    const result = await db.query(
      `INSERT INTO categories (id, title, subtitle, description, icon_svg, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, title, subtitle, description, iconSvg || '', sortOrder || 0]
    );
    await bumpVersion();
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, description, iconSvg, sortOrder } = req.body;

  try {
    const result = await db.query(
      `UPDATE categories 
       SET title = $1, subtitle = $2, description = $3, icon_svg = $4, sort_order = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title, subtitle, description, iconSvg, sortOrder, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    await bumpVersion();
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (CASCADE will delete items)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    await bumpVersion();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
