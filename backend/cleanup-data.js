const { Project, Task, sequelize } = require('./models');
const { Op } = require('sequelize');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('DB connected');

        // 1. Delete duplicate projects (keep the one with ID 1 or the oldest)
        const projects = await Project.findAll({ order: [['id', 'ASC']] });
        const names = [];
        for (const p of projects) {
            if (names.includes(p.name)) {
                console.log(`Deleting duplicate project: ${p.name} (ID: ${p.id})`);
                await p.destroy();
            } else {
                names.push(p.name);
            }
        }

        // 2. Get the main project (the one from original name)
        const mainProject = await Project.findOne({
            where: { name: "Analyse et conception d'une application web de gestion de proje" }
        });

        if (mainProject) {
            console.log(`Found main project ID: ${mainProject.id}`);

            // 3. Associate all tasks to this project and fix them
            const tasks = await Task.findAll();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            for (const task of tasks) {
                const updates = {
                    projectId: mainProject.id,
                    dueDate: task.dueDate || tomorrow, // Ensure date
                    status: Math.random() > 0.3 ? 'DONE' : 'IN_PROGRESS' // Most finished
                };
                console.log(`Updating task ID: ${task.id}`);
                await task.update(updates);
            }
        }

        console.log('Data cleanup completed');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
