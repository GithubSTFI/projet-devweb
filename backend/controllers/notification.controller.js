const { Notification } = require('../models');

// GET USER NOTIFICATIONS
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json({ data: notifications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// MARK AS READ
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [updated] = await Notification.update({ isRead: true }, {
            where: { id, userId }
        });

        if (!updated) return res.status(404).json({ error: 'Notification introuvable' });

        res.json({ message: 'Notification marquée comme lue' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// MARK ALL AS READ
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.update({ isRead: true }, {
            where: { userId, isRead: false }
        });
        res.json({ message: 'Toutes les notifications marquées comme lues' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
