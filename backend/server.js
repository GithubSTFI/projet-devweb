require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const { sequelize } = require('./models');
const apiRoutes = require('./routes/api');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');

const app = express();
const PORT = 3000;

// ─── SECURITY HEADERS (Helmet) ──────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving uploads across origin
    contentSecurityPolicy: false // Disabled for API – let the frontend handle its own CSP
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        // Autorise localhost avec n'importe quel port
        if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Non autorisé par CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── REQUEST LOGGER ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
    console.log(`🚀 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url} | IP: ${req.ip}`);
    next();
});

// ─── BODY PARSERS ────────────────────────────────────────────────────────────
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── GENERAL RATE LIMITER ────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── DIAGNOSTIC ROUTE ────────────────────────────────────────────────────────
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

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]:', err);
    // Never expose stack traces in production
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Erreur interne du serveur'
            : err.message || 'Erreur interne du serveur'
    });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    try {
        await sequelize.authenticate();
        console.log('✅ Base de données connectée.');
        await sequelize.sync({ alter: true });
        console.log('✅ Schéma de base de données synchronisé.');

        const taskController = require('./controllers/task.controller');
        setInterval(() => {
            console.log('[SYSTEM] Vérification des tâches en retard...');
            taskController.checkOverdueTasks();
        }, 3600000);
        taskController.checkOverdueTasks();

    } catch (err) {
        console.error('❌ Erreur DB:', err);
    }
});
