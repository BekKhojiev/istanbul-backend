const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

async function bumpVersion() {
  await db.query('UPDATE menu_version SET version = version + 1, updated_at = NOW() WHERE id = 1');
}

// Create item
router.post('/', requireAdmin, async (req, res) => {
  const { id, categoryId, title, description, price, image, available, sortOrder } = req.body;
  
  try {
    const result = await db.query(
      `INSERT INTO items (id, category_id, title, description, price, image, available, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, categoryId, title, description, price, image || '', available !== false, sortOrder || 0]
    );
    await bumpVersion();
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update item
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { categoryId, title, description, price, image, available, sortOrder } = req.body;

  try {
    const result = await db.query(
      `UPDATE items 
       SET category_id = $1, title = $2, description = $3, price = $4, image = $5, available = $6, sort_order = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [categoryId, title, description, price, image, available, sortOrder, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    await bumpVersion();
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM items WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    await bumpVersion();
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Update availability shortcut
router.put('/:id/availability', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { available } = req.body;
  try {
    const result = await db.query('UPDATE items SET available = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [available, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    await bumpVersion();
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

module.exports = router;
