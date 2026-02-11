const sequelize = require('../config/database');
const User = require('./User');
const Task = require('./Task');
const File = require('./File');

const Notification = require('./Notification');
const ActivityLog = require('./ActivityLog');

// --- ASSOCIATIONS ---

// 1 User -> Many Tasks (Owner)
User.hasMany(Task, {
    foreignKey: 'userId',
    as: 'ownedTasks',
    onDelete: 'CASCADE'
});
Task.belongsTo(User, {
    foreignKey: 'userId',
    as: 'owner'
});

// 1 User -> Many Tasks (Assigned)
User.hasMany(Task, {
    foreignKey: 'assignedUserId',
    as: 'assignedTasks'
});
Task.belongsTo(User, {
    foreignKey: 'assignedUserId',
    as: 'assignedUser'
});

// 1 Task -> Many Files
Task.hasMany(File, {
    foreignKey: 'taskId',
    as: 'files',
    onDelete: 'CASCADE'
});
File.belongsTo(Task, {
    foreignKey: 'taskId',
    as: 'task'
});

// 1 User -> Many Files (Ownership)
User.hasMany(File, {
    foreignKey: 'userId',
    as: 'ownedFiles',
    onDelete: 'CASCADE'
});
File.belongsTo(User, {
    foreignKey: 'userId',
    as: 'owner'
});

// User Notifications
User.hasMany(Notification, {
    foreignKey: 'userId',
    as: 'notifications',
    onDelete: 'CASCADE'
});
Notification.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// User Activity Logs
User.hasMany(ActivityLog, {
    foreignKey: 'userId',
    as: 'activities'
});
ActivityLog.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

module.exports = {
    sequelize,
    User,
    Task,
    File,
    Notification,
    ActivityLog
};
