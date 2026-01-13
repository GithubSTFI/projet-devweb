const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = 'mon_secret_super_securise_etudiant_2024'; // En prod: .env

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
            { expiresIn: '2h' }
        );

        res.json({ token, username: user.username, role: user.role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
