const { Task, User } = require('../models');
const { Op } = require('sequelize');

// GET TASKS (With Filters)
exports.getTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, priority } = req.query;

        const where = { userId }; // Always scope to user

        // Filters
        if (status && status !== 'all') where.status = status;
        if (priority && priority !== 'all') where.priority = priority;

        const tasks = await Task.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        res.json({ data: tasks });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE TASK
exports.createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate } = req.body;
        const userId = req.user.id;

        const task = await Task.create({
            title,
            description,
            priority: priority || 'MEDIUM',
            dueDate,
            userId,
            status: 'TODO'
        });

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
        const updates = req.body; // title, completed -> status ?

        // Map old 'completed' boolean to new status ENUM for compatibility if needed
        if (updates.completed !== undefined) {
            updates.status = updates.completed ? 'DONE' : 'TODO';
        }

        const [updated] = await Task.update(updates, {
            where: { id, userId }
        });

        if (!updated) return res.status(404).json({ error: 'Tâche introuvable' });

        const task = await Task.findOne({ where: { id } });
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

        const deleted = await Task.destroy({
            where: { id, userId }
        });

        if (!deleted) return res.status(404).json({ error: 'Tâche introuvable' });

        res.json({ message: 'Tâche supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET STATS
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const total = await Task.count({ where: { userId } });
        const todo = await Task.count({ where: { userId, status: 'TODO' } });
        const inProgress = await Task.count({ where: { userId, status: 'IN_PROGRESS' } });
        const done = await Task.count({ where: { userId, status: 'DONE' } });
        const archived = await Task.count({ where: { userId, status: 'ARCHIVED' } });

        // Recent tasks (last 5)
        const recentTasks = await Task.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        res.json({
            stats: { total, todo, inProgress, done, archived },
            recentTasks
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

