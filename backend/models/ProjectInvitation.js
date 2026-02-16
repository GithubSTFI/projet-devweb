const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectInvitation = sequelize.define('ProjectInvitation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'EXPIRED'),
        defaultValue: 'PENDING'
    },
    role: {
        type: DataTypes.ENUM('ADMIN', 'MEMBER'),
        defaultValue: 'MEMBER'
    }
}, {
    tableName: 'project_invitations',
    timestamps: true
});

module.exports = ProjectInvitation;
