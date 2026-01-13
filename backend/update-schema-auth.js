const { Client } = require('pg');

const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'projet_web',
    password: '0000',
    port: 5432,
};

async function updateSchema() {
    console.log('--- Mise à jour du Schéma (Authentification) ---');
    const client = new Client(config);

    try {
        await client.connect();

        // 1. Create Users Table
        console.log('1. Création de la table "users"...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 2. Add user_id to Tasks
        console.log('2. Modification de la table "tasks"...');
        // Check if column exists first to avoid error on re-run
        const checkCol = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='tasks' AND column_name='user_id'
    `);

        if (checkCol.rowCount === 0) {
            await client.query(`
            ALTER TABLE tasks 
            ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
        `);
            console.log('   -> Colonne user_id ajoutée.');
        } else {
            console.log('   -> Colonne user_id déjà présente.');
        }

        console.log('\n--- SUCCÈS : Schéma mis à jour ! ---');
    } catch (err) {
        console.error('ERREUR:', err.message);
    } finally {
        client.end();
    }
}

updateSchema();
