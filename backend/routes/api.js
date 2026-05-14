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
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const {
    loginValidation,
    registerValidation,
    forgotPasswordValidation,
    updateProfileValidation,
    changePasswordValidation
} = require('../middlewares/validate.middleware');

// Multer (File Upload) – file type filter for security
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + ext);
    }
});
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Type de fichier non autorisé'), false);
        }
    }
});

// ─── PUBLIC ROUTES (with rate limiting + validation) ─────────────────────────
router.post('/auth/register', authLimiter, registerValidation, authController.register);
router.post('/auth/login', authLimiter, loginValidation, authController.login);
router.post('/auth/forgot-password', authLimiter, forgotPasswordValidation, authController.forgotPassword);
router.post('/auth/reset-password', authLimiter, authController.resetPassword);

// ─── PROTECTED ROUTES ────────────────────────────────────────────────────────
router.use(authenticateToken);

// User Profile
router.get('/profile', userController.getProfile);
router.put('/profile', updateProfileValidation, userController.updateProfile);
router.post('/profile/avatar', upload.single('avatar'), userController.updateAvatar);
router.put('/profile/change-password', changePasswordValidation, userController.changePassword);

// User Listing
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

// ─── ADMIN ONLY ROUTES ───────────────────────────────────────────────────────
router.get('/admin/users', checkRole(['ADMIN']), userController.getAllUsers);
router.put('/admin/users/:id', checkRole(['ADMIN']), userController.updateUser);
router.delete('/admin/users/:id', checkRole(['ADMIN']), userController.deleteUser);
router.get('/admin/logs', checkRole(['ADMIN']), userController.getActivityLogs);

module.exports = router;
