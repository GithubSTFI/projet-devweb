#  TaskFlow - Gestion de Projets Collaborative

Bienvenue sur **TaskFlow**, une plateforme moderne pour organiser vos projets, assigner des tâches et collaborer en temps réel avec votre équipe.

---

##  Fonctionnalités Clés

- **Tableau Kanban Dynamique** : Visualisez l'état de vos tâches (À faire, En cours, Terminé).
- **Gestion de Projets** : Créez des projets et invitez des collaborateurs.
- **Collaboration sur Fichiers** : Joignez des documents (PDF, Word, Images) à vos tâches et partagez-les avec votre équipe.
- **Système de Notifications** : Restez informé des changements importants.
- **Interface Premium** : Design sombre élégant avec effets de transparence (Glassmorphism).

---

##  Installation et Démarrage 

### 1. Prérequis
- **Node.js** installé.
- **PostgreSQL** installé et en cours d'exécution.

### 2. Configuration de la Base de Données
1. Créez une base de données vide nommée `projet_web` dans votre PostgreSQL.
2. Dans le dossier `backend`, créez un fichier `.env` (utilisez `.env.example` comme modèle) :
   ```env
   DB_NAME=projet_web
   DB_USER=votre_utilisateur
   DB_PASS=votre_mot_de_passe
   JWT_SECRET=votre_cle_secrete
   ```

### 3. Synchronisation de la Base de Données
Si vous avez récupéré des mises à jour qui modifient la structure de la base de données, vous pouvez synchroniser les tables sans perdre vos données existantes avec la commande suivante :
```bash
cd backend
npm run db:sync
```
*(Note : La base se synchronise aussi automatiquement au lancement du serveur `npm run dev`)*

### 4. Lancement du Projet
Ouvrez deux terminaux :

**Terminal 1 (Backend) :**
```bash
cd backend
npm install
npm run seed  # Commande magique : Importe une copie EXACTE de la base de données (avec les utilisateurs, projets et tâches existants)
npm run dev
```

**Terminal 2 (Frontend) :**
```bash
cd frontend
npm install
npm start
```
Accédez à l'app via : `http://localhost:4200`

---

##  Endpoints API (Résumé Simple)

###  Authentification
- `POST /api/auth/register` : Créer un compte.
- `POST /api/auth/login` : Se connecter.

###  Projets & Tâches
- `GET /api/projects` : Liste de vos projets.
- `GET /api/tasks` : Toutes vos tâches.
- `PUT /api/tasks/:id` : Mettre à jour une tâche (status, priorité, etc.).

###  Fichiers (Gestion Partagée)
- `POST /api/upload` : Ajouter un fichier à une tâche.
- `GET /api/download/:filename` : Télécharger un document.
- `GET /api/files/preview/:filename` : Voir le fichier dans le navigateur.
- `DELETE /api/files/delete/:id` : Supprimer un fichier (réservé à l'auteur ou au chef de projet).

---

##  Travailler en équipe sur GitHub
Une fois que vous avez fait votre `git pull`, exécutez toujours `npm run seed` pour vous assurer que votre base de données locale est synchronisée avec la structure de l'application et possède les comptes de test.
