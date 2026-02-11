const { User, ActivityLog, Task } = require('../models');
const { logActivity } = require('../services/audit.service');

// GET ALL USERS (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json({ data: users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE USER (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte admin' });
        }

        const userToDelete = await User.findByPk(id);
        if (!userToDelete) return res.status(404).json({ error: 'Utilisateur introuvable' });

        await userToDelete.destroy();

        // Audit
        await logActivity('DELETE_USER', 'USER', id, req.user.id);

        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// LIST USERS (For Assignment - Authenticated users only)
exports.listUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'role'],
            order: [['username', 'ASC']]
        });
        res.json({ data: users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });
        res.json({ data: user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET ACTIVITY LOGS (Admin only)
exports.getActivityLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const logs = await ActivityLog.findAndCountAll({
            include: [{ model: User, as: 'user', attributes: ['username'] }],
            order: [['createdAt', 'DESC']],
            offset: (page - 1) * limit,
            limit: parseInt(limit)
        });

        res.json({
            data: logs.rows,
            pagination: {
                total: logs.count,
                page: parseInt(page),
                totalPages: Math.ceil(logs.count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE USER (Admin only - for roles/promotions)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, username, email } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

        // Don't allow changing self role via this endpoint to avoid locking self out
        if (parseInt(id) === req.user.id && role && role !== user.role) {
            return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
        }

        await user.update({ role, username, email });

        await logActivity('UPDATE_USER', 'USER', id, req.user.id);

        res.json({ message: 'Utilisateur mis à jour', data: user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
