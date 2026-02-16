const { sequelize } = require('./models');
(async () => {
    try {
        const [results] = await sequelize.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'projects';");
        console.log('Projects table structure:');
        console.table(results);

        const [usersResults] = await sequelize.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatarUrl';");
        console.log('Users avatarUrl structure:');
        console.table(usersResults);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
