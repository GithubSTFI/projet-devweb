const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectMember = sequelize.define('ProjectMember', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('ADMIN', 'MEMBER'),
        defaultValue: 'MEMBER'
    }
}, {
    tableName: 'project_members',
    timestamps: true
});

module.exports = ProjectMember;
