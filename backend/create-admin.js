const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const [user, created] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                username: 'admin',
                email: 'admin@taskflow.com',
                password: hashedPassword,
                role: 'ADMIN'
            }
        });

        if (created) {
            console.log('✅ Compte administrateur créé avec succès !');
            console.log('Nom d\'utilisateur : admin');
            console.log('Mot de passe : admin123');
        } else {
            // Force update role to ADMIN if it exists but is USER
            await user.update({ role: 'ADMIN' });
            console.log('ℹ️ L\'utilisateur "admin" existe déjà. Son rôle a été vérifié/mis à jour en ADMIN.');
            console.log('Nom d\'utilisateur : admin');
            console.log('Mot de passe : (inchangé ou admin123 si créé à l\'instant)');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'admin :', error);
    } finally {
        process.exit();
    }
}

createAdmin();
