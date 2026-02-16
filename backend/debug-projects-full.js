const { Project, Task, User, ProjectMember } = require('./models');
const { Op } = require('sequelize');

async function debug() {
    const userId = 8;
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
                    attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'updatedAt', 'projectId']
                }
            ],
            distinct: true
        });

        console.log(JSON.stringify(projects, null, 2));
    } catch (err) {
        console.error(err);
    }
}

debug();
