const { Task, User, Notification, ActivityLog, Project, ProjectMember } = require('../models');
const { Op } = require('sequelize');
const { logActivity } = require('../services/audit.service');
const { sendEmail, getPremiumTemplate } = require('../services/email.service');

// GET TASKS (With Filters, Search & Pagination)
exports.getTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const { status, priority, q, projectId, all, page = 1, limit = 10 } = req.query;

        // Logic for decentralization:
        // 1. If projectId is provided, show project tasks
        // 2. If 'all' is true and user is ADMIN, show all tasks (used for Global Admin View)
        // 3. Otherwise, show user's own tasks (created or assigned)
        let where = {};

        if (projectId) {
            where.projectId = projectId;
        } else if (all === 'true' && role === 'ADMIN') {
            // No user filter for global admin view
            where = {};
        } else {
            // "Mes tâches" behavior
            where = {
                [Op.or]: [
                    { userId },
                    { assignedUserId: userId }
                ]
            };
        }

        // Filters
        if (status && status !== 'all') where.status = status;
        if (priority && priority !== 'all') where.priority = priority;

        // Search by keyword
        if (q) {
            const searchQuery = {
                [Op.or]: [
                    { title: { [Op.iLike]: `%${q}%` } },
                    { description: { [Op.iLike]: `%${q}%` } }
                ]
            };
            if (where[Op.and]) {
                where[Op.and].push(searchQuery);
            } else {
                where[Op.and] = [searchQuery];
            }
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
        const { title, description, priority, dueDate, assignedUserId, projectId } = req.body;
        const userId = req.user.id;

        // Restriction: Only Project OWNER or Project ADMIN can assign tasks to others
        if (projectId && assignedUserId && parseInt(assignedUserId) !== userId) {
            const project = await Project.findByPk(projectId);
            if (project) {
                const isOwner = project.ownerId == userId;
                const membership = await ProjectMember.findOne({
                    where: { projectId, userId }
                });
                const isAdmin = membership && membership.role == 'ADMIN';

                if (!isOwner && !isAdmin) {
                    return res.status(403).json({ error: 'Seuls les administrateurs du projet peuvent assigner des tâches à d\'autres membres.' });
                }
            }
        }

        const task = await Task.create({
            title,
            description,
            priority: priority || 'MEDIUM',
            dueDate,
            userId,
            assignedUserId,
            projectId,
            status: 'TODO'
        });

        // Audit Log
        await logActivity('CREATE_TASK', 'TASK', task.id, userId);

        // Internal Notification to assigned user
        if (assignedUserId && parseInt(assignedUserId) !== userId) {
            console.log(`[TASK] Assignation détectée pour la tâche ${task.id} à l'utilisateur ${assignedUserId}`);
            await Notification.create({
                userId: assignedUserId,
                message: `Une nouvelle tâche vous a été assignée : ${title}`
            });

            // Email Notification (Async)
            try {
                const recipient = await User.findByPk(assignedUserId);
                if (recipient) {
                    console.log(`[EMAIL] Envoi mail à ${recipient.email}...`);
                    const assignmentHtml = getPremiumTemplate(
                        'Nouvelle tâche assignée',
                        `<p>L'utilisateur <strong>${req.user.username}</strong> vous a assigné une nouvelle tâche : <strong>"${title}"</strong>.</p>
                         <p>Connectez-vous pour commencer à travailler dessus.</p>`,
                        'Voir la tâche',
                        'http://localhost:4200/tasks'
                    );

                    sendEmail(
                        recipient.email,
                        'Nouvelle tâche assignée',
                        `Bonjour, la tâche "${title}" vous a été assignée.`,
                        assignmentHtml
                    );
                } else {
                    console.warn(`[EMAIL] Utilisateur assigné ${assignedUserId} non trouvé.`);
                }
            } catch (emailErr) {
                console.error('[EMAIL] Erreur lors de la récupération du destinataire:', emailErr);
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

        const taskToCheck = await Task.findByPk(id);
        if (!taskToCheck) {
            return res.status(404).json({ error: 'Tâche introuvable' });
        }

        // Check global ownership, assignee status, or global ADMIN role
        const isGlobalAdmin = role == 'ADMIN';
        const isTaskOwner = taskToCheck.userId == userId;
        const isTaskAssignee = taskToCheck.assignedUserId == userId;

        // Check Project Role (Owner or Admin)
        const project = await Project.findByPk(taskToCheck.projectId);
        const isProjectOwner = project && project.ownerId == userId;
        const membership = await ProjectMember.findOne({
            where: { projectId: taskToCheck.projectId, userId }
        });
        const isProjectAdmin = membership && membership.role == 'ADMIN';

        if (!isGlobalAdmin && !isTaskOwner && !isTaskAssignee && !isProjectOwner && !isProjectAdmin) {
            return res.status(403).json({ error: 'Droits insuffisants pour modifier cette tâche' });
        }

        const oldAssignedId = taskToCheck.assignedUserId;

        // Restriction: Only Project OWNER or ADMIN can assign to someone else
        // Use loose equality (!=) to handle null/number type differences
        if (updates.assignedUserId && parseInt(updates.assignedUserId) != oldAssignedId && parseInt(updates.assignedUserId) != userId) {
            const projectId = taskToCheck.projectId;
            if (projectId) {
                const project = await Project.findByPk(projectId);
                if (project) {
                    const isOwnerR = project.ownerId == userId;
                    const membershipR = await ProjectMember.findOne({
                        where: { projectId, userId }
                    });
                    const isAdminR = membershipR && membershipR.role == 'ADMIN';

                    if (!isOwnerR && !isAdminR) {
                        return res.status(403).json({ error: 'Seuls les administrateurs du projet peuvent assigner des tâches.' });
                    }
                }
            }
        }

        const [updatedRowsCount] = await Task.update(updates, {
            where: { id }
        });

        if (updatedRowsCount > 0) {
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
            if (updates.assignedUserId && parseInt(updates.assignedUserId) !== oldAssignedId) {
                console.log(`[TASK] Réassignation détectée pour la tâche ${id} vers l'utilisateur ${updates.assignedUserId}`);
                await Notification.create({
                    userId: updates.assignedUserId,
                    message: `La tâche "${taskToCheck.title}" vous a été assignée.`
                });

                try {
                    const recipient = await User.findByPk(updates.assignedUserId);
                    if (recipient) {
                        const reassignmentHtml = getPremiumTemplate(
                            'Assignation de tâche',
                            `<p>La tâche <strong>"${taskToCheck.title}"</strong> vous a été réassignée.</p>
                             <p>Consultez votre liste de tâches pour voir les détails.</p>`,
                            'Voir mes tâches',
                            'http://localhost:4200/tasks'
                        );

                        sendEmail(
                            recipient.email,
                            'Assignation de tâche',
                            `La tâche "${taskToCheck.title}" vous a été assignée.`,
                            reassignmentHtml
                        );
                    } else {
                        console.warn(`[EMAIL] Utilisateur assigné ${updates.assignedUserId} non trouvé.`);
                    }
                } catch (emailErr) {
                    console.error('[EMAIL] Erreur lors de la récupération du destinataire:', emailErr);
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

        // Permission check: Global Admin, Task Creator, Project Owner or Project Admin
        const isGlobalAdmin = role == 'ADMIN';
        const isTaskOwner = taskToDelete.userId == userId;

        const project = await Project.findByPk(taskToDelete.projectId);
        const isProjectOwner = project && project.ownerId == userId;
        const membership = await ProjectMember.findOne({
            where: { projectId: taskToDelete.projectId, userId }
        });
        const isProjectAdmin = membership && membership.role == 'ADMIN';

        if (!isGlobalAdmin && !isTaskOwner && !isProjectOwner && !isProjectAdmin) {
            return res.status(403).json({ error: 'Seuls les administrateurs du projet ou le créateur peuvent supprimer cette tâche' });
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
