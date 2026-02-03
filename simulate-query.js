const { File } = require('./backend/models');

async function simulate() {
    try {
        const userId = 9; // Precious Winner
        console.log(`Simulating query for user ID: ${userId}`);

        const files = await File.findAll({
            where: { userId: userId },
            logging: console.log // Log the SQL
        });

        console.log(`Found ${files.length} files for user ${userId}`);
        files.forEach(f => console.log(` - ${f.originalName} (Owner: ${f.userId})`));

        const allFiles = await File.findAll();
        console.log(`\nTotal files in DB: ${allFiles.length}`);
        allFiles.forEach(f => console.log(` - ${f.originalName} (Owner: ${f.userId})`));

    } catch (e) {
        console.error(e);
    }
}

simulate();
