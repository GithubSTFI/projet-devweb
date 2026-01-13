const { Client } = require('pg');

const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'projet_web',
    password: '0000',
    port: 5432,
};

async function forceSetup() {
    console.log('>>> RÉPARATION BASE DE DONNÉES <<<');
    const client = new Client(config);

    try {
        await client.connect();
        console.log('1. Connecté à PostgreSQL.');

        // 1. Create Users Table (Force)
        console.log('2. Création Table "users"...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('   -> OK.');

        // 2. Add Foreign Key to Tasks
        console.log('3. Liaison Tasks <-> Users...');
        // Add column if missing
        await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='user_id') THEN
          ALTER TABLE tasks ADD COLUMN user_id INTEGER;
        END IF;
      END $$;
    `);

        // Add Constraint if missing
        try {
            await client.query(`
          ALTER TABLE tasks 
          ADD CONSTRAINT fk_user 
          FOREIGN KEY (user_id) 
          REFERENCES users(id) 
          ON DELETE CASCADE
        `);
        } catch (e) {
            // Ignore if constraint already exists
            if (!e.message.includes('already exists')) console.error(e.message);
        }
        console.log('   -> OK.');

        console.log('>>> BASE DE DONNÉES RÉPARÉE ET PRÊTE <<<');

    } catch (err) {
        console.error('ERREUR GRAVE:', err);
    } finally {
        client.end();
    }
}

forceSetup();
