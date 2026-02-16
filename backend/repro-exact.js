const { Project, ProjectMember, sequelize } = require('./models');
(async () => {
    try {
        await sequelize.authenticate();
        console.log('DB ok');

        const name = "Analyse et conception d'une application web de gestion de proje";
        const description = "Definir, stucturer, organiser et repartir les taches au sein des membres afin d'ameliorer l'efficacité et la productivité de l'equipe";
        const ownerId = 8;
        const color = "#6366f1";

        console.log('Creating project...');
        const project = await Project.create({ name, description, ownerId, color });
        console.log('Project created:', project.id);

        await ProjectMember.create({
            projectId: project.id,
            userId: ownerId,
            role: 'ADMIN'
        });
        console.log('Member created');

        process.exit(0);
    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    }
})();
