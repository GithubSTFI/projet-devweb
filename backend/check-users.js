require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'projet_web',
    password: process.env.DB_PASS || '0000',
    port: process.env.DB_PORT || 5432,
});

async function checkUsers() {
    try {
        const res = await pool.query('SELECT * FROM users');
        console.log('\n--- UTILISATEURS INSCRITS ---');
        if (res.rows.length === 0) {
            console.log('Aucun utilisateur trouvé.');
        } else {
            console.table(res.rows);
        }
    } catch (err) {
        console.error('Erreur SQL:', err.message);
    } finally {
        pool.end();
    }
}

checkUsers();
