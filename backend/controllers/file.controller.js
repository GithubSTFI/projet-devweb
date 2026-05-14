const { File, Task, User } = require('../models');
const { Op } = require('sequelize');
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

// LIST FILES (Filtered by Task visibility)
exports.getFiles = async (req, res) => {
    try {
        const { taskId } = req.query;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Utilisateur non identifié.' });
        }

        let where = {};
        let include = [{ model: Task, as: 'task' }];

        if (taskId) {
            where.taskId = taskId;
        } else {
            // VUE GLOBALE : Fichiers personnels OU fichiers de tâches où je suis assigné/propriétaire
            where = {
                [Op.or]: [
                    { userId: req.user.id }, // Mes fichiers
                    { '$task.userId$': req.user.id }, // Fichiers de mes tâches (Propriétaire)
                    { '$task.assignedUserId$': req.user.id } // Fichiers des tâches qui m'ont été assignées
                ]
            };
        }

        const files = await File.findAll({
            where,
            include,
            subQuery: false, // Indispensable pour les filtres OR sur les relations
            order: [['createdAt', 'DESC']]
        });
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DOWNLOAD FILE
exports.downloadFile = async (req, res) => {
    try {
        const { filename } = req.params;

        // On cherche le fichier et on inclut la tâche pour vérifier les droits
        const fileRecord = await File.findOne({
            where: { filename },
            include: [{ model: Task, as: 'task' }]
        });

        if (!fileRecord) {
            return res.status(404).json({ error: 'Fichier introuvable.' });
        }

        // Vérification des droits : Auteur OU Propriétaire Tâche OU Assigné Tâche
        const isOwner = Number(fileRecord.userId) === Number(req.user.id);
        const isTaskRelated = fileRecord.task && (
            Number(fileRecord.task.userId) === Number(req.user.id) ||
            Number(fileRecord.task.assignedUserId) === Number(req.user.id)
        );

        if (!isOwner && !isTaskRelated) {
            return res.status(403).json({ error: 'Accès refusé au téléchargement.' });
        }

        const absolutePath = path.join(__dirname, '..', fileRecord.path);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'Fichier physique introuvable.' });
        }

        res.download(absolutePath, fileRecord.originalName);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PREVIEW FILE (Inline)
exports.previewFile = async (req, res) => {
    try {
        const { filename } = req.params;

        // On cherche le fichier et on inclut la tâche pour les droits
        const fileRecord = await File.findOne({
            where: { filename },
            include: [{ model: Task, as: 'task' }]
        });

        if (!fileRecord) return res.status(404).json({ error: 'Fichier introuvable.' });

        // Vérification des droits : Auteur OU Propriétaire Tâche OU Assigné Tâche
        const isOwner = Number(fileRecord.userId) === Number(req.user.id);
        const isTaskRelated = fileRecord.task && (
            Number(fileRecord.task.userId) === Number(req.user.id) ||
            Number(fileRecord.task.assignedUserId) === Number(req.user.id)
        );

        if (!isOwner && !isTaskRelated) {
            return res.status(403).json({ error: 'Accès refusé à l\'aperçu.' });
        }

        const absolutePath = path.join(__dirname, '..', fileRecord.path);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'Fichier physique introuvable.' });
        }

        res.sendFile(absolutePath);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE FILE
exports.deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[DELETE_FILE] Tentative de suppression du fichier ID: ${id} par User: ${req.user.id}`);

        // Find the record
        const fileRecord = await File.findByPk(id, {
            include: [{ model: Task, as: 'task' }]
        });

        if (!fileRecord) {
            console.error(`[DELETE_FILE] Fichier ${id} non trouvé en base.`);
            return res.status(404).json({ error: 'Fichier introuvable.' });
        }

        // Vérification des droits : Propriétaire du fichier OU propriétaire de la tâche liée
        const isFileOwner = Number(fileRecord.userId) === Number(req.user.id);
        const isTaskOwner = fileRecord.task && Number(fileRecord.task.userId) === Number(req.user.id);

        if (!isFileOwner && !isTaskOwner) {
            console.error(`[DELETE_FILE] Accès refusé. FileOwner: ${fileRecord.userId}, TaskOwner: ${fileRecord.task?.userId}, Requester: ${req.user.id}`);
            return res.status(403).json({ error: 'Accès refusé. Vous n\'avez pas les droits pour supprimer ce fichier.' });
        }

        // Delete physical file from disk (Optionnel si absent pour éviter crash)
        try {
            const absolutePath = path.join(__dirname, '..', fileRecord.path);
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
                console.log(`[DELETE_FILE] Fichier physique supprimé: ${absolutePath}`);
            } else {
                console.warn(`[DELETE_FILE] Fichier physique absent du disque: ${absolutePath}`);
            }
        } catch (fsErr) {
            console.error(`[DELETE_FILE] Erreur lors de la suppression physique:`, fsErr);
            // On continue pour supprimer au moins l'entrée en base
        }

        // Delete database record
        await fileRecord.destroy();
        console.log(`[DELETE_FILE] Entrée DB supprimée pour le fichier ${id}`);

        res.json({ message: 'Fichier supprimé avec succès' });
    } catch (error) {
        console.error(`[DELETE_FILE] Erreur critique:`, error);
        res.status(500).json({ error: error.message });
    }
};
