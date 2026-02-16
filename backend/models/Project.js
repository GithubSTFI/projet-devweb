const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: '#6366f1'
    }
}, {
    tableName: 'projects',
    timestamps: true
});

module.exports = Project;
