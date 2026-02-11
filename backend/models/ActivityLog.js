const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false // e.g., 'CREATE_TASK', 'UPLOAD_FILE'
    },
    entityType: {
        type: DataTypes.STRING,
        allowNull: false // e.g., 'TASK', 'FILE'
    },
    entityId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'activity_logs',
    timestamps: true,
    updatedAt: false // Audit is write-only typically
});

module.exports = ActivityLog;
