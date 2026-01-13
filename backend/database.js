const { Pool } = require('pg');

// Configuration de la connexion PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'projet_web', // NOM DE LA BASE PRECIS
    password: '0000',       // MOT DE PASSE UTILISATEUR
    port: 5432,
});

pool.on('error', (err, client) => {
    console.error('Erreur inattendue sur le client PostgreSQL', err);
    process.exit(-1);
});

module.exports = pool;
