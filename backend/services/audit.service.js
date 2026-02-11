const { ActivityLog } = require('../models');

/**
 * Enregistre une action dans l'Audit Log
 * @param {string} action - Nom de l'action (ex: 'CREATE_TASK')
 * @param {string} entityType - Type d'entité (ex: 'TASK')
 * @param {number} entityId - ID de l'entité concernée
 * @param {number} userId - ID de l'utilisateur qui fait l'action
 */
const logActivity = async (action, entityType, entityId, userId) => {
    try {
        await ActivityLog.create({
            action,
            entityType,
            entityId,
            userId
        });
    } catch (error) {
        console.error('Erreur Audit Log:', error);
    }
};

module.exports = { logActivity };
