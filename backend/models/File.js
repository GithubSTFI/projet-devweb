const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const File = sequelize.define('File', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    originalName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mimeType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    size: {
        type: DataTypes.INTEGER,
        validate: {
            min: 0
        }
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'files',
    timestamps: true
});

module.exports = File;
