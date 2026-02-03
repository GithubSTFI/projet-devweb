const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const authController = require('../controllers/auth.controller');
const taskController = require('../controllers/task.controller');
const fileController = require('../controllers/file.controller');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'mon_secret_super_securise_etudiant_2024';

// --- MIDDLEWARE CONFIG ---

// Auth
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        console.log(`[AUTH-DEBUG] Requête de l'utilisateur: ${user.username} (ID: ${user.id}) sur ${req.originalUrl}`);
        next();
    });
};

// Multer (File Upload)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this folder exists
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });


// --- ROUTES ---

// Auth
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Tasks
router.get('/tasks', authenticateToken, taskController.getTasks);
router.get('/tasks/stats', authenticateToken, taskController.getStats);
router.post('/tasks', authenticateToken, taskController.createTask);
router.put('/tasks/:id', authenticateToken, taskController.updateTask);
router.delete('/tasks/:id', authenticateToken, taskController.deleteTask);

// Files (Protected or Public depending on needs, simplifying for demo)
router.post('/upload', authenticateToken, upload.single('file'), fileController.uploadFile);
router.get('/files', authenticateToken, fileController.getFiles); // Now protected
router.get('/download/:filename', authenticateToken, fileController.downloadFile); // Now protected

// Demos (Required for Requirements 4 & 5)
router.post('/async-task', (req, res) => {
    console.log('[Async] Début...');
    setTimeout(() => console.log('[Async] Fin.'), 5000);
    res.json({ message: 'Traitement lancé.' });
});

router.get('/secure/search', async (req, res) => {
    // Re-implementing simplified search for demo
    const { Task } = require('../models');
    const { Op } = require('sequelize');
    const query = req.query.q || '';

    try {
        // Secure way (Sequelize does parameterization automatically)
        const tasks = await Task.findAll({
            where: { title: { [Op.like]: `%${query}%` } }
        });
        res.json({ data: tasks, info: 'SÉCURISÉ (ORM)' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/insecure/search', async (req, res) => {
    const { sequelize } = require('../models');
    const query = req.query.q;
    // VERY BAD: Direct SQL Concatenation for Demo purpose
    const sql = `SELECT * FROM tasks WHERE title LIKE '%${query}%'`;

    try {
        const [results] = await sequelize.query(sql);
        res.json({ data: results, warning: 'VULNÉRABLE (Injection SQL)' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
