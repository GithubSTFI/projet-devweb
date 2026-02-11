const { sequelize } = require('./models');

async function syncSchema() {
    console.log('🔄 Synchronisation de la base de données PostgreSQL...');
    try {
        await sequelize.sync({ alter: true });
        console.log('✅ Base de données synchronisée avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur de synchronisation :', error);
        process.exit(1);
    }
}

syncSchema();
