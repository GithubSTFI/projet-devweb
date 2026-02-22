const { User, Project, ProjectMember, Task } = require('./models');
const { Op } = require('sequelize');

async function debug() {
    try {
        const tasks = await Task.findAll({
            where: {
                title: { [Op.like]: '%Appeler le client%' }
            }
        });
        console.log('--- TARGET TASK ---');
        console.table(tasks.map(t => ({
            id: t.id,
            title: t.title,
            projectId: t.projectId,
            userId: t.userId,
            assignedUserId: t.assignedUserId
        })));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

debug();
