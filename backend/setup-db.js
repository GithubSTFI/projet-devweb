const { Client } = require('pg');

const config = {
    user: 'postgres',
    host: 'localhost',
    password: '0000', // UPDATED
    port: 5432,
};

const dbName = 'projet_web';

async function setup() {
    console.log('--- Initialisation de la Base de Données ---');

    // 1. Connect to default 'postgres' db
    const client = new Client({ ...config, database: 'postgres' });
    try {
        await client.connect();
        console.log('1. Connecté à PostgreSQL.');

        // 2. Check if DB exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
        if (res.rowCount === 0) {
            console.log(`2. Création de la base '${dbName}'...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log('   -> Base créée.');
        } else {
            console.log(`2. La base '${dbName}' existe déjà.`);
        }
        await client.end();

        // 3. Connect to the NEW DB
        const projectClient = new Client({ ...config, database: dbName });
        await projectClient.connect();
        console.log(`3. Connecté à '${dbName}'.`);

        // 4. Create Tables
        console.log('4. Vérification des tables...');
        await projectClient.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE
      )
    `);
        console.log('   -> Table "tasks" prête.');
        await projectClient.end();

        console.log('\n--- SUCCÈS : Base de données configurée ! ---');
    } catch (err) {
        console.error('\n--- ERREUR ---');
        console.error(err.message);
        if (err.message.includes('password authentication failed')) {
            console.error('\n>>> LE MOT DE PASSE EST INCORRECT. Modifiez le fichier setup-db.js avec votre mot de passe pgAdmin.');
        }
    }
}

setup();
