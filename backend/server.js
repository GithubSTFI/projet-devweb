require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { sequelize } = require('./models');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = 3000;

// Request Logger (TOP)
app.use((req, res, next) => {
    console.log(`🚀 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', apiRoutes);

// Diagnostic Route
app.get('/api/diag', async (req, res) => {
    try {
        await sequelize.authenticate();
        const tables = await sequelize.getQueryInterface().showAllTables();
        const userCount = await sequelize.models.User.count();
        res.json({
            status: 'ok',
            database: 'connected',
            tables,
            userCount,
            env: process.env.NODE_ENV || 'development',
            cwd: process.cwd()
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Erreur interne du serveur',
        details: err.errors // For Sequelize validation errors
    });
});

// Start Server
app.listen(PORT, async () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    try {
        await sequelize.authenticate();
        console.log('✅ Base de données connectée.');

        await sequelize.sync({ alter: true });
        console.log('✅ Schéma de base de données synchronisé.');

        // Simple cron-like interval for overdue tasks (every 1 hour)
        const taskController = require('./controllers/task.controller');
        setInterval(() => {
            console.log('[SYSTEM] Vérification des tâches en retard...');
            taskController.checkOverdueTasks();
        }, 3600000);

        // Run once on startup
        taskController.checkOverdueTasks();

    } catch (err) {
        console.error('❌ Erreur DB:', err);
    }
});
