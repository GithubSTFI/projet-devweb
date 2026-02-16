const { sequelize } = require('./models');
(async () => {
    try {
        const [results] = await sequelize.query("SELECT n.nspname as schema, t.typname as type FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typtype = 'e';");
        console.log('Enums in database:');
        console.table(results);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
