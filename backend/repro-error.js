const { Project, ProjectMember } = require('./models');
(async () => {
    try {
        console.log('Attempting to create project...');
        const project = await Project.create({
            name: "Analyse et conception d'une application web de gestion de proje",
            description: "Definir, stucturer, organiser et repartir les taches au sein des membres afin d'ameliorer l'efficacité et la productivité de l'equipe",
            ownerId: 8,
            color: "#6366f1"
        });
        console.log('Project created:', project.id);

        await ProjectMember.create({
            projectId: project.id,
            userId: 8,
            role: 'ADMIN'
        });
        console.log('Member created');
        process.exit(0);
    } catch (e) {
        console.error('FAILED TO CREATE:', e);
        process.exit(1);
    }
})();
