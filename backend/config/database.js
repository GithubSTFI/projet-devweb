const { Sequelize } = require('sequelize');

// Configuration de la connexion Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME || 'projet_web',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || '0000',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false, // On peut désactiver les logs en prod
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize;
