const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'projet_web',
    password: '0000',
    port: 5432,
});

async function showTasks() {
    try {
        const res = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
        console.log('\n--- CONTENU DE LA BASE DE DONNÉES (Table: tasks) ---');
        if (res.rows.length === 0) {
            console.log('Aucune tâche trouvée.');
        } else {
            console.table(res.rows);
        }
        console.log('----------------------------------------------------\n');
    } catch (err) {
        console.error('Erreur:', err.message);
    } finally {
        pool.end();
    }
}

showTasks();
