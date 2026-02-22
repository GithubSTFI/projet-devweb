const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Controllers
const authController = require('../controllers/auth.controller');
const taskController = require('../controllers/task.controller');
const fileController = require('../controllers/file.controller');
const userController = require('../controllers/user.controller');
const notificationController = require('../controllers/notification.controller');
const projectController = require('../controllers/project.controller');

// Middlewares
const { authenticateToken } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/role.middleware');

// Multer (File Upload)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- PUBLIC ROUTES ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

router.get('/test-email', (req, res) => {
    const { sendEmail } = require('../services/email.service');
    sendEmail('fsiewe@yaba-in.com', 'Test TaskFlow', 'Si vous voyez ce mail, la config SMTP est enfin correcte !')
        .then(() => res.json({ message: 'Email de test envoyé.' }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// --- PROTECTED ROUTES (USER & ADMIN) ---
router.use(authenticateToken); // Protect all routes below

// User Profile & Listing
router.get('/profile', userController.getProfile);
router.post('/profile/avatar', upload.single('avatar'), userController.updateAvatar);
router.get('/users', userController.listUsers);

// Projects
router.get('/projects', projectController.getMyProjects);
router.post('/projects', projectController.createProject);
router.get('/projects/:id', projectController.getProjectDetails);
router.delete('/projects/:id', projectController.deleteProject);
router.post('/projects/:id/invite', projectController.inviteMember);
router.post('/projects/accept-invitation', projectController.acceptInvitation);
router.put('/projects/:id/members/:userId/role', projectController.updateMemberRole);

// Tasks
router.get('/tasks', taskController.getTasks);
router.get('/tasks/stats', taskController.getStats);
router.post('/tasks', taskController.createTask);
router.put('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);

// Files
router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/files', fileController.getFiles);
router.get('/download/:filename', fileController.downloadFile);
router.get('/files/preview/:filename', fileController.previewFile);

// Notifications
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.delete('/notifications/:id', notificationController.deleteNotification);
router.post('/notifications/delete-multiple', notificationController.deleteMultipleNotifications);

// --- ADMIN ONLY ROUTES ---
router.get('/admin/users', checkRole(['ADMIN']), userController.getAllUsers);
router.put('/admin/users/:id', checkRole(['ADMIN']), userController.updateUser);
router.delete('/admin/users/:id', checkRole(['ADMIN']), userController.deleteUser);
router.get('/admin/logs', checkRole(['ADMIN']), userController.getActivityLogs);


module.exports = router;
