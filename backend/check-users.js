const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'projet_web',
    password: '0000',
    port: 5432,
});

async function checkUsers() {
    try {
        const res = await pool.query('SELECT id, username, created_at FROM users');
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
