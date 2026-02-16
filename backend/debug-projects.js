const { Project, Task, User, ProjectMember } = require('./models');
const { Op } = require('sequelize');

async function debug() {
    const userId = 8;
    try {
        const projects = await Project.findAll({
            include: [
                {
                    model: User,
                    as: 'members',
                    where: { id: userId },
                    required: false,
                    attributes: ['id', 'username']
                },
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'username']
                },
                {
                    model: Task,
                    as: 'tasks',
                    attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'updatedAt', 'projectId']
                }
            ],
            where: {
                [Op.or]: [
                    { ownerId: userId },
                    { '$members.id$': userId }
                ]
            },
            order: [
                ['updatedAt', 'DESC'],
                [{ model: Task, as: 'tasks' }, 'updatedAt', 'DESC']
            ]
        });

        console.log('Found projects:', projects.length);
        projects.forEach(p => {
            console.log(`Project ID: ${p.id}, Name: ${p.name}`);
            console.log(`Tasks count: ${p.tasks ? p.tasks.length : 'N/A'}`);
        });
    } catch (err) {
        console.error(err);
    }
}

debug();
