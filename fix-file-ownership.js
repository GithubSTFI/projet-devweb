const { File } = require('./backend/models');

async function fix() {
    try {
        // Assign all files with NULL userId to SIEWE FORTUNE (ID 8)
        const [updatedCount] = await File.update(
            { userId: 8 },
            { where: { userId: null } }
        );
        console.log(`✅ ${updatedCount} fichiers anciens ont été attribués à l'utilisateur 8 (SIEWE FORTUNE).`);

        const files = await File.findAll();
        console.log('\n--- ÉTAT FINAL DES FICHIERS ---');
        files.forEach(f => {
            console.log(`ID: ${f.id} | Nom: ${f.originalName} | UserID: ${f.userId}`);
        });

    } catch (e) {
        console.error(e);
    }
}

fix();
