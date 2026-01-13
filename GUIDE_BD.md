# Guide Base de Données (PostgreSQL)

Comme vous débutez avec les bases de données, j'ai créé un script automatique pour tout gérer. Voici comment cela fonctionne **de A à Z**.

## 1. Le Concept
Une base de données est comme un grand classeur Excel sécurisé.
- **PostgreSQL** est le logiciel (le classeur).
- **Une Base de Données (DB)** est un fichier spécifique (ex: `projet_web`).
- **Une Table** est une feuille dans ce fichier (ex: `tasks` pour vos tâches).

## 2. Ce que j'ai fait (Automatique)
J'ai créé un script `setup-db.js` dans le dossier `backend`. Ce script :
1.  Se connecte au "Général" de PostgreSQL (la base par défaut `postgres`).
2.  Vérifie si votre base `projet_web` existe. Si non, il la crée.
3.  Se connecte à `projet_web`.
4.  Crée la table `tasks` avec les colonnes :
    - `id` (Numéro unique automatique)
    - `title` (Titre de la tâche)
    - `done` (Statut : Fait ou Pas fait)

## 3. Comment Vérifier (Via pgAdmin)
Puisque vous avez **pgAdmin** :
1.  Ouvrez pgAdmin.
2.  Connectez-vous à votre serveur (Localhost).
3.  Faites un clic droit sur "Databases" -> "Refresh".
4.  Vous verrez apparaître `projet_web`.
5.  Allez dans `Schemas` > `public` > `Tables`.
6.  Vous verrez la table `tasks`.
7.  Clic droit sur `tasks` > `View/Edit Data` > `All Rows` pour voir vos données.

## 4. Configuration (Mot de passe)
**IMPORTANT** : Le script utilise le mot de passe `password`. Si votre mot de passe pgAdmin est différent :
1.  Ouvrez le fichier `backend/database.js`.
2.  Modifiez la ligne `password: 'password'` avec le vôtre.
3.  Faites de même dans `backend/setup-db.js` (si vous devez le relancer).
