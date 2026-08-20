const db = require('./db');

async function migrate() {
  console.log('Starting migration...');
  
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          title JSONB NOT NULL DEFAULT '{}',
          subtitle JSONB NOT NULL DEFAULT '{}',
          description JSONB NOT NULL DEFAULT '{}',
          icon_svg TEXT DEFAULT '',
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Categories table created.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          title JSONB NOT NULL DEFAULT '{}',
          description JSONB NOT NULL DEFAULT '{}',
          price NUMERIC(12,2) NOT NULL DEFAULT 0,
          image TEXT DEFAULT '',
          available BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Items table created.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_version (
          id INTEGER PRIMARY KEY DEFAULT 1,
          version INTEGER DEFAULT 1,
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      INSERT INTO menu_version (id, version) VALUES (1, 1) ON CONFLICT DO NOTHING;
    `);
    console.log('Menu version table created.');

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    db.pool.end();
  }
}

migrate();
