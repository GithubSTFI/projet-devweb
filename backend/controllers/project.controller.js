const { Project, ProjectMember, ProjectInvitation, User, Task } = require('../models');
const crypto = require('crypto');
const { sendEmail } = require('../services/email.service');

// GET ALL PROJECTS FOR CURRENT USER
exports.getMyProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        // Projects where user is owner OR member
        const projects = await Project.findAll({
            include: [
                {
                    model: User,
                    as: 'members',
                    where: { id: userId },
                    required: false,
                    attributes: ['id', 'username']
                },
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'username']
                },
                {
                    model: Task,
                    as: 'tasks',
                    attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'updatedAt']
                }
            ],
            where: {
                [require('sequelize').Op.or]: [
                    { ownerId: userId },
                    { '$members.id$': userId }
                ]
            },
            order: [
                ['updatedAt', 'DESC'],
                [{ model: Task, as: 'tasks' }, 'updatedAt', 'DESC']
            ]
        });
        res.json({ data: projects });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE PROJECT
exports.createProject = async (req, res) => {
    try {
        console.log('[PROJECT] Création demandée par:', req.user.id);
        const { name, description, color } = req.body;
        console.log('[PROJECT] Data:', { name, color });

        const project = await Project.create({ name, description, ownerId: req.user.id, color });
        console.log('[PROJECT] Projet créé ID:', project.id);

        // Add owner as member with ADMIN role
        await ProjectMember.create({
            projectId: project.id,
            userId: req.user.id,
            role: 'ADMIN'
        });
        console.log('[PROJECT] Propriétaire ajouté comme membre ADMIN');

        res.status(201).json({ data: project });
    } catch (error) {
        console.error('[PROJECT] ERREUR CREATION:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET PROJECT DETAILS
exports.getProjectDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findByPk(id, {
            include: [
                { model: User, as: 'members', attributes: ['id', 'username', 'email', 'avatarUrl'] },
                { model: User, as: 'owner', attributes: ['id', 'username'] },
                { model: ProjectInvitation, as: 'invitations' }
            ]
        });

        if (!project) return res.status(404).json({ error: 'Projet introuvable' });

        res.json({ data: project });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// INVITE MEMBER
exports.inviteMember = async (req, res) => {
    try {
        const { id } = req.params; // projectId
        const { email, role } = req.body;

        const project = await Project.findByPk(id);
        if (!project) return res.status(404).json({ error: 'Projet introuvable' });

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            // Check if already member
            const isMember = await ProjectMember.findOne({ where: { projectId: id, userId: existingUser.id } });
            if (isMember) return res.status(400).json({ error: 'Cet utilisateur est déjà membre du projet' });

            // Directly add if user exists? Or still send invitation?
            // Let's send an invitation anyway for consent/notification
        }

        const token = crypto.randomBytes(20).toString('hex');
        const invitation = await ProjectInvitation.create({
            projectId: id,
            email,
            token,
            role: role || 'MEMBER'
        });

        // Send Email
        const inviteLink = `http://localhost:4200/accept-invitation?token=${token}`;
        await sendEmail(
            email,
            `Invitation au projet ${project.name}`,
            `Vous avez été invité à rejoindre le projet "${project.name}" sur TaskFlow.\n\nCliquez ici pour accepter : ${inviteLink}`
        );

        res.json({ message: 'Invitation envoyée', data: invitation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ACCEPT INVITATION
exports.acceptInvitation = async (req, res) => {
    try {
        const { token } = req.body;
        const invitation = await ProjectInvitation.findOne({ where: { token, status: 'PENDING' } });

        if (!invitation) return res.status(404).json({ error: 'Invitation invalide ou expirée' });

        const user = await User.findOne({ where: { email: invitation.email } });
        if (!user) return res.status(400).json({ error: 'Vous devez créer un compte avec cet email avant d\'accepter l\'invitation' });

        await ProjectMember.create({
            projectId: invitation.projectId,
            userId: user.id,
            role: invitation.role
        });

        await invitation.update({ status: 'ACCEPTED' });

        res.json({ message: 'Invitation acceptée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
