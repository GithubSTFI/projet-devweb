const { sequelize } = require('./models');

async function syncDatabase() {
    console.log('🔄 Synchronisation de la Base de Données (Sequelize)...');
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion DB réussie.');

        // sync({ alter: true }) updates schema without dropping data if possible
        // sync({ force: true }) drops everything (Use with caution, good for Reset)

        // Using alter: true to persist data while allowing schema updates
        await sequelize.sync({ alter: true });

        console.log('✅ Modèles synchronisés avec succès !');
        console.log('   - Tables : Users, Tasks, Files');
        console.log('   - Relations établies.');

    } catch (error) {
        console.error('❌ Erreur de synchronisation :', error);
    } finally {
        await sequelize.close();
    }
}

syncDatabase();
