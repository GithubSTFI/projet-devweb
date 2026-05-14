const fs = require('fs');
const { sequelize, User, Project, ProjectMember, Task, File, Notification, ActivityLog } = require('./models');

async function exportDatabase() {
    try {
        console.log('⏳ Exportation des données en cours...');
        await sequelize.authenticate();

        const data = {
            users: await User.findAll({ raw: true }),
            projects: await Project.findAll({ raw: true }),
            projectMembers: await ProjectMember.findAll({ raw: true }),
            tasks: await Task.findAll({ raw: true }),
            files: await File.findAll({ raw: true }),
            notifications: await Notification.findAll({ raw: true }),
            activityLogs: await ActivityLog.findAll({ raw: true })
        };

        fs.writeFileSync('db-dump.json', JSON.stringify(data, null, 2));
        
        console.log('✅ Exportation réussie ! Fichier créé : db-dump.json');
        console.log('Ce fichier contient exactement toutes les données actuelles de votre base de données.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de l\'exportation :', error);
        process.exit(1);
    }
}

exportDatabase();
