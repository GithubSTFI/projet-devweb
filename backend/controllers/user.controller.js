const { User, ActivityLog, Task } = require('../models');
const { logActivity } = require('../services/audit.service');
const bcrypt = require('bcryptjs');

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
        await logActivity('DELETE_USER', 'USER', id, req.user.id);
        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// LIST USERS (For Assignment)
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
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.json({ data: user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE PROFILE (email only – username is unique identifier, not changeable)
exports.updateProfile = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

        // Check email uniqueness
        if (email && email !== user.email) {
            const existing = await User.findOne({ where: { email } });
            if (existing) {
                return res.status(409).json({ error: 'Cet email est déjà utilisé par un autre compte' });
            }
        }

        await user.update({ email: email || user.email });
        await logActivity('UPDATE_PROFILE', 'USER', user.id, req.user.id);

        const updated = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
        res.json({ message: 'Profil mis à jour avec succès', data: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            console.warn(`[SECURITY] Failed password change attempt: userId=${req.user.id}, ip=${req.ip}`);
            return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'actuel' });
        }

        const hashed = await bcrypt.hash(newPassword, 12);
        await user.update({ password: hashed });

        await logActivity('CHANGE_PASSWORD', 'USER', user.id, req.user.id);
        console.log(`[SECURITY] Password changed successfully: userId=${req.user.id}, ip=${req.ip}, time=${new Date().toISOString()}`);

        res.json({ message: 'Mot de passe modifié avec succès' });
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

// UPDATE USER (Admin only)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, username, email } = req.body;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
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

// UPDATE AVATAR
exports.updateAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier téléchargé' });
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
        const avatarUrl = `/uploads/${req.file.filename}`;
        await user.update({ avatarUrl });
        res.json({ message: 'Photo de profil mise à jour', avatarUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
