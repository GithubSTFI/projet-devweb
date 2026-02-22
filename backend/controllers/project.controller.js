const { Project, ProjectMember, ProjectInvitation, User, Task } = require('../models');
const crypto = require('crypto');
const { sendEmail, getPremiumTemplate } = require('../services/email.service');

// GET ALL PROJECTS FOR CURRENT USER
exports.getMyProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        // Projects where user is owner OR member
        const projects = await Project.findAll({
            where: {
                [require('sequelize').Op.or]: [
                    { ownerId: userId },
                    { '$members.id$': userId }
                ]
            },
            include: [
                {
                    model: User,
                    as: 'members',
                    attributes: ['id', 'username'],
                    required: false,
                    through: { attributes: [] }
                },
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'username']
                },
                {
                    model: Task,
                    as: 'tasks',
                    attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'updatedAt', 'projectId']
                }
            ],
            order: [['updatedAt', 'DESC']],
            distinct: true
        });
        console.log(`[PROJECTS] User ${userId} found ${projects.length} projects`);
        if (projects.length > 0) {
            console.log(`[PROJECTS] First project tasks count: ${projects[0].tasks?.length || 0}`);
        }
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
                {
                    model: User,
                    as: 'members',
                    attributes: ['id', 'username', 'email', 'avatarUrl'],
                    through: { attributes: ['role'] }
                },
                { model: User, as: 'owner', attributes: ['id', 'username'] },
                { model: ProjectInvitation, as: 'invitations' }
            ]
        });

        if (!project) return res.status(404).json({ error: 'Projet introuvable' });

        // Get current user's role in this project
        let currentUserRole = 'MEMBER';
        if (project.ownerId == req.user.id) {
            currentUserRole = 'OWNER';
        } else {
            const membership = await ProjectMember.findOne({
                where: { projectId: id, userId: req.user.id }
            });
            if (membership) currentUserRole = membership.role;
        }

        res.json({ data: project, currentUserRole });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE MEMBER ROLE
exports.updateMemberRole = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { role } = req.body; // 'ADMIN' or 'MEMBER'

        const project = await Project.findByPk(id);
        if (!project) return res.status(404).json({ error: 'Projet introuvable' });

        // Only OWNER can change roles
        if (project.ownerId != req.user.id) {
            return res.status(403).json({ error: 'Seul le propriétaire peut changer les rôles des membres' });
        }

        // Check if target user is not the owner
        if (parseInt(userId) === project.ownerId) {
            return res.status(400).json({ error: 'Le rôle du propriétaire ne peut pas être modifié' });
        }

        const membership = await ProjectMember.findOne({ where: { projectId: id, userId } });
        if (!membership) return res.status(404).json({ error: 'Membre introuvable dans ce projet' });

        membership.role = role;
        await membership.save();

        res.json({ message: 'Rôle mis à jour avec succès' });
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

        // Check permissions: Only OWNER or Project ADMIN can invite
        const isOwner = project.ownerId === req.user.id;
        const membership = await ProjectMember.findOne({
            where: { projectId: id, userId: req.user.id }
        });
        const isAdmin = membership && membership.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Vous n\'avez pas les droits pour inviter des membres à ce projet' });
        }

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

        const inviteHtml = getPremiumTemplate(
            `Nouvelle invitation`,
            `<p>Vous avez été invité à collaborer sur le projet <strong>"${project.name}"</strong> sur TaskFlow.</p>
             <p>Rejoignez votre équipe et commencez à travailler sur les tâches dès maintenant.</p>`,
            'Accepter l\'invitation',
            inviteLink
        );

        await sendEmail(
            email,
            `Invitation au projet ${project.name}`,
            `Vous avez été invité à rejoindre le projet "${project.name}" sur TaskFlow. Cliquez ici pour accepter : ${inviteLink}`,
            inviteHtml
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

// DELETE PROJECT
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        const project = await Project.findByPk(id);
        if (!project) return res.status(404).json({ error: 'Projet introuvable' });

        // Only owner or site ADMIN can delete
        if (project.ownerId !== userId && role !== 'ADMIN') {
            return res.status(403).json({ error: 'Seul le propriétaire peut supprimer ce projet' });
        }

        await project.destroy();
        res.json({ message: 'Projet supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
