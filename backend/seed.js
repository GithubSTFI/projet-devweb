const fs = require('fs');
const path = require('path');
const { sequelize, User, Project, ProjectMember, Task, File, Notification, ActivityLog } = require('./models');

async function resetSequence(model, tableName) {
    if (sequelize.getDialect() === 'postgres') {
        try {
            await sequelize.query(`SELECT setval('"${tableName}_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "${tableName}"));`);
        } catch (e) {
            console.log(`⚠️ Impossible de mettre à jour la séquence pour ${tableName}`);
        }
    }
}

async function seed() {
    try {
        console.log('⏳ Lecture du fichier d\'export (db-dump.json)...');
        const dumpPath = path.join(__dirname, 'db-dump.json');
        
        if (!fs.existsSync(dumpPath)) {
            console.error('❌ Le fichier db-dump.json est introuvable. Exécutez d\'abord node export-db.js sur la machine source.');
            process.exit(1);
        }

        const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

        console.log('🔄 Synchronisation de la base de données (suppression des anciennes données)...');
        // Attention : force: true supprime TOUTES les tables et les recrée à neuf !
        await sequelize.sync({ force: true });

        console.log('📥 Importation des utilisateurs...');
        await User.bulkCreate(data.users, { ignoreDuplicates: true });
        await resetSequence(User, 'Users');

        console.log('📥 Importation des projets...');
        await Project.bulkCreate(data.projects, { ignoreDuplicates: true });
        await resetSequence(Project, 'Projects');

        console.log('📥 Importation des membres de projets...');
        await ProjectMember.bulkCreate(data.projectMembers, { ignoreDuplicates: true });

        console.log('📥 Importation des tâches...');
        await Task.bulkCreate(data.tasks, { ignoreDuplicates: true });
        await resetSequence(Task, 'Tasks');

        console.log('📥 Importation des fichiers...');
        await File.bulkCreate(data.files, { ignoreDuplicates: true });
        await resetSequence(File, 'Files');

        console.log('📥 Importation des notifications...');
        await Notification.bulkCreate(data.notifications, { ignoreDuplicates: true });
        await resetSequence(Notification, 'Notifications');

        console.log('📥 Importation de l\'historique...');
        await ActivityLog.bulkCreate(data.activityLogs, { ignoreDuplicates: true });
        await resetSequence(ActivityLog, 'ActivityLogs');

        console.log('✅ Base de données importée et prête ! Vos collaborateurs ont exactement vos données.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur lors de l\'importation :', error);
        process.exit(1);
    }
}

seed();
