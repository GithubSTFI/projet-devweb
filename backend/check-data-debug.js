const { Project, ProjectMember } = require('./models');
(async () => {
    try {
        const projects = await Project.findAll();
        console.log('Projects:');
        console.table(projects.map(p => p.toJSON()));

        const members = await ProjectMember.findAll();
        console.log('Members:');
        console.table(members.map(m => m.toJSON()));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
