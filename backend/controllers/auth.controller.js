const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendEmail, getPremiumTemplate } = require('../services/email.service');

const JWT_SECRET = process.env.JWT_SECRET || 'mon_secret_super_securise_etudiant_2024';

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User (Role defaults to USER)
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        // Envoi de l'email de bienvenue (Async)
        const welcomeHtml = getPremiumTemplate(
            `Bienvenue ${username} !`,
            `<p>Nous sommes ravis de vous compter parmi nous sur <strong>TaskFlow Manager</strong>.</p>
             <p>Vous pouvez dès maintenant commencer à organiser vos projets et vos tâches en toute simplicité.</p>
             <p>Votre aventure vers une meilleure productivité commence ici.</p>`,
            'Accéder à mon tableau de bord',
            'http://localhost:4200'
        );

        sendEmail(
            email,
            'Bienvenue sur TaskFlow Manager !',
            `Bonjour ${username}, votre compte a été créé avec succès.`,
            welcomeHtml
        );

        res.status(201).json({ message: 'Utilisateur créé', userId: user.id });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Ce nom d\'utilisateur existe déjà.' });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find User
        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(400).json({ error: 'Utilisateur inconnu.' });

        // Check Password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Mot de passe incorrect.' });

        // Generate Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const crypto = require('crypto');

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: 'Email non trouvé.' });

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 h
        await user.save();

        const resetLink = `http://localhost:4200/reset-password/${token}`;

        const resetHtml = getPremiumTemplate(
            'Réinitialisation du mot de passe',
            `<p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte TaskFlow Manager.</p>
             <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable pendant une heure.</p>
             <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>`,
            'Réinitialiser mon mot de passe',
            resetLink
        );

        await sendEmail(
            email,
            'Réinitialisation de mot de passe',
            `Utilisez ce lien pour réinitialiser votre mot de passe : ${resetLink}`,
            resetHtml
        );

        res.json({ message: 'Email envoyé.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { [require('sequelize').Op.gt]: Date.now() }
            }
        });

        if (!user) return res.status(400).json({ error: 'Lien invalide ou expiré.' });

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ message: 'Mot de passe mis à jour.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
