const { Project, Task, User, ProjectMember } = require('./models');
const { Op } = require('sequelize');

async function debug() {
    console.log('--- DEBUGGING PROJECT TASKS ---');

    // Simulate finding user id=8
    const userId = 8;
    console.log(`Searching projects for userId: ${userId}`);

    try {
        const projects = await Project.findAll({
            where: {
                [Op.or]: [
                    { ownerId: userId },
                    { '$members.id$': userId }
                ]
            },
            include: [
                {
                    model: User,
                    as: 'members',
                    attributes: ['id', 'username'],
                    required: false,
                    through: { attributes: [] }
                },
                {
                    model: Task,
                    as: 'tasks',
                    attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'updatedAt', 'projectId'],
                    separate: true,
                    order: [['updatedAt', 'DESC']]
                }
            ],
            order: [['updatedAt', 'DESC']]
        });

        console.log(`[PROJECTS] User ${userId} - Total Projects found: ${projects.length}`);
        projects.forEach(p => {
            console.log(`[PROJECTS] ID: ${p.id}, Name: ${p.name}`);
            console.log(`   Tasks Array exists? ${!!p.tasks}`);
            console.log(`   Tasks count: ${p.tasks ? p.tasks.length : 'N/A'}`);
            if (p.tasks && p.tasks.length > 0) {
                console.log(`   Sample Task: ${p.tasks[0].title} (Status: ${p.tasks[0].status})`);
            }
        });

    } catch (err) {
        console.error('ERROR:', err);
    }
}

debug();
