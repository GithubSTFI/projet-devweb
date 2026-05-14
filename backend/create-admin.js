const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('Admin@2024!', 10);
        const [user, created] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                username: 'admin',
                email: 'admin@taskflow.dev',
                password: hashedPassword,
                role: 'ADMIN'
            }
        });

        if (created) {
            console.log('✅ Compte administrateur créé avec succès !');
            console.log('Nom d\'utilisateur : admin');
            console.log('Email : admin@taskflow.dev');
            console.log('Mot de passe : Admin@2024!');
        } else {
            // Force update password and email if already exists
            await user.update({ 
                email: 'admin@taskflow.dev',
                password: hashedPassword,
                role: 'ADMIN' 
            });
            console.log('ℹ️ L\'utilisateur "admin" a été mis à jour avec les nouveaux identifiants.');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'admin :', error);
    } finally {
        process.exit();
    }
}

createAdmin();
