const { Task } = require('./models');

const dummyTasks = [
    { title: 'Réviser le rapport annuel', description: 'Vérifier les chiffres du Q4 et préparer le résumé.', status: 'TODO', priority: 'HIGH' },
    { title: 'Appeler le client Dupont', description: 'Prendre rendez-vous pour la présentation.', status: 'IN_PROGRESS', priority: 'MEDIUM' },
    { title: 'Mise à jour du serveur', description: 'Appliquer les correctifs de sécurité mensuels.', status: 'DONE', priority: 'HIGH' },
    { title: 'Ranger le bureau', description: 'Nettober et organiser les dossiers physiques.', status: 'ARCHIVED', priority: 'LOW' },
    { title: 'Préparer la réunion marketing', description: 'Créer les slides et collecter les données.', status: 'TODO', priority: 'MEDIUM' },
    { title: 'Développer le composant Auth', description: 'Finaliser le login social.', status: 'IN_PROGRESS', priority: 'HIGH' },
    { title: 'Acheter des fournitures', description: 'Commander du papier et des cartouches.', status: 'DONE', priority: 'LOW' },
    { title: 'Envoyer les factures', description: 'Vérifier les paiements en attente.', status: 'TODO', priority: 'MEDIUM' },
    { title: 'Backup de la base de données', description: 'Exécuter le script de sauvegarde.', status: 'DONE', priority: 'HIGH' },
    { title: 'Documentation API', description: 'Écrire les exemples pour Swagger.', status: 'TODO', priority: 'LOW' },
    { title: 'Correction bug CSS Safari', description: 'Fixer le décalage sur mobile.', status: 'IN_PROGRESS', priority: 'MEDIUM' },
    { title: 'Répondre aux emails', description: 'Traiter les 50 messages en attente.', status: 'TODO', priority: 'LOW' },
    { title: 'Planning de sprint', description: 'Assigner les tickets pour la semaine.', status: 'DONE', priority: 'MEDIUM' },
    { title: 'Design du nouveau logo', description: 'Envoyer les ébauches au client.', status: 'ARCHIVED', priority: 'MEDIUM' },
    { title: 'Audit de sécurité', description: 'Vérifier les logs du pare-feu.', status: 'TODO', priority: 'HIGH' },
    { title: 'Formation nouvelle recrue', description: 'Session Zoom de 2 heures.', status: 'IN_PROGRESS', priority: 'MEDIUM' },
    { title: 'Réserver salle de conférence', description: 'Pour le séminaire de février.', status: 'DONE', priority: 'LOW' },
    { title: 'Nettoyage du code legacy', description: 'Supprimer les fonctions inutilisées.', status: 'TODO', priority: 'MEDIUM' },
    { title: 'Optimisation images', description: 'Réduire le poids de la page accueil.', status: 'IN_PROGRESS', priority: 'LOW' },
    { title: 'Paiement fournisseur Cloud', description: 'Valider le prélèvement automatique.', status: 'DONE', priority: 'HIGH' },
    { title: 'Tests unitaires Frontend', description: 'Atteindre 80% de couverture.', status: 'TODO', priority: 'HIGH' },
    { title: 'Briefing projet B', description: 'Définir les objectifs principaux.', status: 'IN_PROGRESS', priority: 'MEDIUM' },
    { title: 'Mise en ligne v1.2', description: 'Déploiement en production.', status: 'DONE', priority: 'HIGH' },
    { title: 'Recrutement designer', description: 'Trier les portfolios reçus.', status: 'TODO', priority: 'MEDIUM' },
    { title: 'Newsletter de Janvier', description: 'Rédiger le contenu et envoyer.', status: 'IN_PROGRESS', priority: 'LOW' },
    { title: 'Conférence Tech', description: 'Assister à la session sur Angular.', status: 'DONE', priority: 'LOW' },
    { title: 'Analyse de la concurrence', description: 'Étude comparative des prix.', status: 'ARCHIVED', priority: 'MEDIUM' },
    { title: 'Mise à jour LinkedIn', description: 'Partager le succès du projet.', status: 'TODO', priority: 'LOW' },
    { title: 'Entretien annuel', description: 'Préparer les points de discussion.', status: 'IN_PROGRESS', priority: 'HIGH' },
    { title: 'Sortie d\'équipe', description: 'Organiser le after-work.', status: 'DONE', priority: 'LOW' }
];

async function seed(userId) {
    try {
        const tasksWithUser = dummyTasks.map(t => ({ ...t, userId }));
        await Task.bulkCreate(tasksWithUser);
        console.log('--- 30 tâches insérées avec succès pour l\'utilisateur ID:', userId);
    } catch (error) {
        console.error('Erreur lors de l\'insertion:', error);
    } finally {
        process.exit();
    }
}

const targetUserId = process.argv[2] ? parseInt(process.argv[2]) : 1;
seed(targetUserId);
