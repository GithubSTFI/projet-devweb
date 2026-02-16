const { User } = require('./models');
(async () => {
    try {
        const users = await User.findAll({ attributes: ['id', 'username', 'email'] });
        console.table(users.map(u => u.toJSON()));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
