const fs = require('fs');
const path = require('path');
const db = require('./db');

async function seed() {
  console.log('Starting seed process...');
  const dataPath = path.join(__dirname, 'menusite_data.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('Data file not found:', dataPath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed Categories
    console.log('Seeding categories...');
    let catOrder = 0;
    for (const catId of Object.keys(data.categories)) {
      const cat = data.categories[catId];
      await client.query(
        `INSERT INTO categories (id, title, subtitle, description, icon_svg, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET 
         title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, description = EXCLUDED.description, icon_svg = EXCLUDED.icon_svg`,
        [catId, cat.title, cat.subtitle, cat.description, cat.iconSvg || '', catOrder++]
      );
    }

    // 2. Seed Items
    console.log('Seeding items...');
    let itemOrder = 0;
    for (const item of data.menuItems) {
      await client.query(
        `INSERT INTO items (id, category_id, title, description, price, image, available, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
         category_id = EXCLUDED.category_id, title = EXCLUDED.title, description = EXCLUDED.description, 
         price = EXCLUDED.price, image = EXCLUDED.image, available = EXCLUDED.available`,
        [item.id, item.categoryId, item.title, item.description, item.price, item.image, true, itemOrder++]
      );
    }

    // Bump version
    await client.query('UPDATE menu_version SET version = version + 1, updated_at = NOW() WHERE id = 1');
    
    await client.query('COMMIT');
    console.log('Seed completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
  } finally {
    client.release();
    db.pool.end();
  }
}

seed();
