const { File, Task } = require('../models');
const path = require('path');
const fs = require('fs');

// UPLOAD FILE
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé.' });

        // Create DB Entry
        const { filename, originalname, mimetype, size, path: filePath } = req.file;
        const { taskId } = req.body; // Optional: Link to a task immediately

        const fileEntry = await File.create({
            filename: filename,       // Multer generated name
            originalName: originalname,
            mimeType: mimetype,
            size: size,
            path: filePath,
            taskId: taskId || null,   // Can be null if generic upload
            userId: req.user.id       // LINK TO USER
        });

        res.status(201).json({ message: 'Fichier uploadé', file: fileEntry });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// LIST FILES (Can be filtered by Task)
exports.getFiles = async (req, res) => {
    try {
        const { taskId } = req.query;
        const where = { userId: req.user.id }; // ALWAYS FILTER BY USER
        if (taskId) where.taskId = taskId;

        const files = await File.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json({ files }); // Match frontend expected format
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DOWNLOAD FILE
exports.downloadFile = async (req, res) => {
    try {
        const { filename } = req.params;

        // Find in DB to verify ownership
        const fileRecord = await File.findOne({
            where: {
                filename,
                userId: req.user.id // ENSURE OWNERSHIP
            }
        });

        if (!fileRecord) {
            return res.status(404).json({ error: 'Fichier introuvable ou accès refusé.' });
        }

        const absolutePath = path.resolve(fileRecord.path);
        res.download(absolutePath, fileRecord.originalName);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
