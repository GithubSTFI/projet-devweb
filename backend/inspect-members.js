const { sequelize } = require('./models');
(async () => {
    try {
        const [results] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_members';");
        console.log('ProjectMembers table structure:');
        console.table(results);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
