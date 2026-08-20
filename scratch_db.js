const { Client } = require('pg');

async function createDb() {
    const passwords = ['postgres', 'password', 'root', '1234', ''];
    let connected = false;

    for (const pwd of passwords) {
        const client = new Client({
            user: 'postgres',
            host: 'localhost',
            database: 'postgres',
            password: pwd,
            port: 5432,
        });

        try {
            await client.connect();
            console.log(`Connected with password: '${pwd}'`);
            
            // Check if DB exists
            const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'istanbul'");
            if (res.rowCount === 0) {
                console.log("Creating database 'istanbul'...");
                await client.query('CREATE DATABASE istanbul');
                console.log("Database created!");
            } else {
                console.log("Database 'istanbul' already exists.");
            }
            
            await client.end();
            connected = true;
            
            // Write to .env
            const fs = require('fs');
            fs.writeFileSync('.env', `DATABASE_URL=postgresql://postgres:${pwd}@localhost:5432/istanbul\nADMIN_API_KEY=your-secret-admin-key-here\nPORT=3000`);
            console.log("Updated .env file with correct password.");
            break;
        } catch (e) {
            // connection failed, try next password
        }
    }

    if (!connected) {
        console.log("Could not auto-connect to PostgreSQL. Please update .env manually.");
    }
}

createDb();
