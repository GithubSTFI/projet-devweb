const { File, User } = require('./backend/models');

async function check() {
    try {
        const files = await File.findAll();
        console.log('--- TOUS LES FICHIERS EN BASE ---');
        files.forEach(f => {
            console.log(`ID: ${f.id} | Nom: ${f.originalName} | UserID: ${f.userId} | Filename: ${f.filename}`);
        });

        const users = await User.findAll();
        console.log('\n--- UTILISATEURS ---');
        users.forEach(u => {
            console.log(`ID: ${u.id} | Username: ${u.username}`);
        });

    } catch (e) {
        console.error(e);
    }
}

check();
