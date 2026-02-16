const { sequelize } = require('./models');
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to sync database:', error);
        process.exit(1);
    }
})();
