const sequelize = require('../config/database');
const User = require('./User');
const Task = require('./Task');
const File = require('./File');

// --- ASSOCIATIONS ---

// 1 User -> Many Tasks
User.hasMany(Task, {
    foreignKey: 'userId',
    as: 'tasks',
    onDelete: 'CASCADE'
});
Task.belongsTo(User, {
    foreignKey: 'userId',
    as: 'owner'
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

// 1 User -> Many Files (Direct ownership for privacy)
User.hasMany(File, {
    foreignKey: 'userId',
    as: 'ownedFiles',
    onDelete: 'CASCADE'
});
File.belongsTo(User, {
    foreignKey: 'userId',
    as: 'owner'
});

module.exports = {
    sequelize,
    User,
    Task,
    File
};
