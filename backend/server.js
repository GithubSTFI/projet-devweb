require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { sequelize } = require('./models');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', apiRoutes);

// Test Route
app.get('/', (req, res) => {
    res.json({ message: 'Bienvenue sur l\'API TaskFlow Manager 🚀' });
});

// Start Server
app.listen(PORT, async () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    try {
        await sequelize.authenticate();
        console.log('✅ Base de données connectée.');

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
