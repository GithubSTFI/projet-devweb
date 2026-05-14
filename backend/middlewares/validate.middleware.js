const { body, validationResult } = require('express-validator');

/**
 * Middleware factory: runs validationResult and returns 422 if any errors.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ error: 'Données invalides', details: errors.array() });
    }
    next();
};

/**
 * Validation rules for login.
 * Uses express-validator trim + escape to sanitize inputs → prevents XSS / SQLi attempts via body.
 */
const loginValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Nom d\'utilisateur requis')
        .isLength({ max: 50 }).withMessage('Nom trop long')
        .escape(),
    body('password')
        .notEmpty().withMessage('Mot de passe requis')
        .isLength({ max: 128 }).withMessage('Mot de passe trop long'),
    validate
];

/**
 * Validation rules for registration.
 */
const registerValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Nom d\'utilisateur requis')
        .isLength({ min: 3, max: 30 }).withMessage('Entre 3 et 30 caractères')
        .matches(/^[a-zA-Z0-9_ ]+$/).withMessage('Caractères alphanumériques uniquement')
        .escape(),
    body('email')
        .trim()
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Mot de passe minimum 8 caractères')
        .isLength({ max: 128 }).withMessage('Mot de passe trop long')
        .matches(/[A-Z]/).withMessage('Au moins une majuscule')
        .matches(/[0-9]/).withMessage('Au moins un chiffre'),
    validate
];

/**
 * Validation rules for forgot-password.
 */
const forgotPasswordValidation = [
    body('email')
        .trim()
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    validate
];

/**
 * Validation rules for profile update.
 */
const updateProfileValidation = [
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    validate
];

/**
 * Validation rules for change password.
 */
const changePasswordValidation = [
    body('currentPassword')
        .notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Nouveau mot de passe minimum 8 caractères')
        .isLength({ max: 128 }).withMessage('Trop long')
        .matches(/[A-Z]/).withMessage('Au moins une majuscule')
        .matches(/[0-9]/).withMessage('Au moins un chiffre'),
    validate
];

module.exports = {
    loginValidation,
    registerValidation,
    forgotPasswordValidation,
    updateProfileValidation,
    changePasswordValidation
};
