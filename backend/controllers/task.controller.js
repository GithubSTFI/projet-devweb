const { Task, User, Notification } = require('../models');
const { Op } = require('sequelize');
const { logActivity } = require('../services/audit.service');
const { sendEmail } = require('../services/email.service');

// GET TASKS (With Filters, Search & Pagination)
exports.getTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const { status, priority, q, page = 1, limit = 10 } = req.query;

        // Logic for ADMIN vs USER
        // ADMIN can see everything
        // USER can see their own tasks OR tasks assigned to them
        const where = role === 'ADMIN' ? {} : {
            [Op.or]: [
                { userId },
                { assignedUserId: userId }
            ]
        };

        // Filters
        if (status && status !== 'all') where.status = status;
        if (priority && priority !== 'all') where.priority = priority;

        // Search by keyword
        if (q) {
            where[Op.or] = [
                ...(where[Op.or] || []),
                { title: { [Op.iLike]: `%${q}%` } },
                { description: { [Op.iLike]: `%${q}%` } }
            ];
        }

        const tasks = await Task.findAndCountAll({
            where,
            include: [
                { model: User, as: 'owner', attributes: ['id', 'username'] },
                { model: User, as: 'assignedUser', attributes: ['id', 'username'] }
            ],
            order: [['createdAt', 'DESC']],
            offset: (page - 1) * limit,
            limit: parseInt(limit)
        });

        res.json({
            data: tasks.rows,
            pagination: {
                total: tasks.count,
                page: parseInt(page),
                totalPages: Math.ceil(tasks.count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE TASK
exports.createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, assignedUserId } = req.body;
        const userId = req.user.id;

        const task = await Task.create({
            title,
            description,
            priority: priority || 'MEDIUM',
            dueDate,
            userId,
            assignedUserId,
            status: 'TODO'
        });

        // Audit Log
        await logActivity('CREATE_TASK', 'TASK', task.id, userId);

        // Internal Notification to assigned user
        if (assignedUserId && assignedUserId !== userId) {
            await Notification.create({
                userId: assignedUserId,
                message: `Une nouvelle tâche vous a été assignée : ${title}`
            });

            // Email Notification (Async)
            const recipient = await User.findByPk(assignedUserId);
            if (recipient) {
                sendEmail(
                    recipient.email,
                    'Nouvelle tâche assignée',
                    `Bonjour, la tâche "${title}" vous a été assignée.`,
                    `<h1>Nouvelle assignation</h1><p>La tâche <strong>${title}</strong> vous a été assignée par ${req.user.username}.</p>`
                );
            }
        }

        res.status(201).json({ message: 'Tâche créée', data: task });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE TASK
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;
        const updates = req.body;

        // Check ownership or admin
        const taskToCheck = await Task.findByPk(id);
        if (!taskToCheck) return res.status(404).json({ error: 'Tâche introuvable' });

        if (role !== 'ADMIN' && taskToCheck.userId !== userId && taskToCheck.assignedUserId !== userId) {
            return res.status(403).json({ error: 'Droits insuffisants' });
        }

        const oldAssignedId = taskToCheck.assignedUserId;

        const [updated] = await Task.update(updates, {
            where: { id }
        });

        if (updated) {
            // Audit Log
            await logActivity('UPDATE_TASK', 'TASK', id, userId);

            // If status changed to DONE
            if (updates.status === 'DONE' && taskToCheck.status !== 'DONE') {
                await Notification.create({
                    userId: taskToCheck.userId,
                    message: `La tâche "${taskToCheck.title}" est désormais terminée.`
                });
            }

            // If assignment changed
            if (updates.assignedUserId && updates.assignedUserId !== oldAssignedId) {
                await Notification.create({
                    userId: updates.assignedUserId,
                    message: `La tâche "${taskToCheck.title}" vous a été assignée.`
                });

                const recipient = await User.findByPk(updates.assignedUserId);
                if (recipient) {
                    sendEmail(
                        recipient.email,
                        'Assignation de tâche',
                        `La tâche "${taskToCheck.title}" vous a été assignée.`
                    );
                }
            }
        }

        const task = await Task.findOne({ where: { id }, include: ['owner', 'assignedUser'] });
        res.json({ message: 'Mise à jour réussie', data: task });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE TASK
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        const taskToDelete = await Task.findByPk(id);
        if (!taskToDelete) return res.status(404).json({ error: 'Tâche introuvable' });

        // ADMIN can delete any task, USER only their own
        if (role !== 'ADMIN' && taskToDelete.userId !== userId) {
            return res.status(403).json({ error: 'Seul le propriétaire ou un ADMIN peut supprimer cette tâche' });
        }

        await taskToDelete.destroy();

        // Audit Log
        await logActivity('DELETE_TASK', 'TASK', id, userId);

        res.json({ message: 'Tâche supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET STATS (Role-aware)
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        if (role === 'ADMIN') {
            // Stats for ADMIN
            const totalUsers = await User.count();
            const totalTasks = await Task.count();

            // Additional stats for ADMIN
            const todo = await Task.count({ where: { status: 'TODO' } });
            const inProgress = await Task.count({ where: { status: 'IN_PROGRESS' } });
            const done = await Task.count({ where: { status: 'DONE' } });

            const recentActivities = await ActivityLog.findAll({
                limit: 10,
                order: [['createdAt', 'DESC']],
                include: [{ model: User, as: 'user', attributes: ['username'] }]
            });

            return res.json({
                role: 'ADMIN',
                stats: {
                    totalUsers,
                    totalTasks,
                    todo,
                    inProgress,
                    done
                },
                recentActivities
            });
        } else {
            // Stats for USER
            const total = await Task.count({
                where: { [Op.or]: [{ userId }, { assignedUserId: userId }] }
            });
            const done = await Task.count({
                where: {
                    [Op.or]: [{ userId }, { assignedUserId: userId }],
                    status: 'DONE'
                }
            });
            const inProgress = await Task.count({
                where: {
                    [Op.or]: [{ userId }, { assignedUserId: userId }],
                    status: 'IN_PROGRESS'
                }
            });
            const assigned = await Task.count({
                where: { assignedUserId: userId, userId: { [Op.ne]: userId } }
            });

            // Overdue tasks: due_date < now AND status != DONE
            const overdue = await Task.count({
                where: {
                    [Op.or]: [{ userId }, { assignedUserId: userId }],
                    status: { [Op.ne]: 'DONE' },
                    dueDate: { [Op.lt]: new Date() }
                }
            });

            const recentTasks = await Task.findAll({
                where: { [Op.or]: [{ userId }, { assignedUserId: userId }] },
                order: [['createdAt', 'DESC']],
                limit: 5,
                include: ['owner', 'assignedUser']
            });

            return res.json({
                role: 'USER',
                stats: { total, todo: total - done - inProgress, inProgress, done, overdue, assigned },
                recentTasks
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// AUTOMATIC OVERDUE DETECTION
exports.checkOverdueTasks = async () => {
    try {
        const { Op } = require('sequelize');
        const overdueTasks = await Task.findAll({
            where: {
                status: { [Op.ne]: 'DONE' },
                dueDate: { [Op.lt]: new Date() }
            }
        });

        for (const task of overdueTasks) {
            // Check if alert notification already exists to avoid spamming
            const exists = await Notification.findOne({
                where: {
                    userId: task.userId,
                    message: { [Op.like]: `%${task.title}%retard%` }
                }
            });

            if (!exists) {
                await Notification.create({
                    userId: task.userId,
                    message: `ALERTE: La tâche "${task.title}" est passée de date !`,
                    type: 'SYSTEM'
                });
                console.log(`[ALERTE] Notification envoyée pour la tâche #${task.id}`);
            }
        }
    } catch (error) {
        console.error('Erreur détection retard:', error);
    }
};
