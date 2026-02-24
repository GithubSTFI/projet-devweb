# 📋 TaskFlow Manager — Documentation Technique Complète

> **Version :** 1.0.0  
> **Date de rédaction :** Février 2026  
> **Type de projet :** Application Web Full-Stack de gestion de tâches et de projets collaboratifs  

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Architecture globale](#2-architecture-globale)
3. [Technologies utilisées](#3-technologies-utilisées)
4. [Structure du projet](#4-structure-du-projet)
5. [Backend — API REST (Node.js / Express)](#5-backend--api-rest-nodejs--express)
   - 5.1 [Serveur et configuration](#51-serveur-et-configuration)
   - 5.2 [Base de données et modèles](#52-base-de-données-et-modèles)
   - 5.3 [Routes API](#53-routes-api)
   - 5.4 [Contrôleurs](#54-contrôleurs)
   - 5.5 [Services transverses](#55-services-transverses)
6. [Frontend — Application Angular](#6-frontend--application-angular)
   - 6.1 [Architecture Angular](#61-architecture-angular)
   - 6.2 [Routing et Guards](#62-routing-et-guards)
   - 6.3 [Services Angular](#63-services-angular)
   - 6.4 [Composants principaux](#64-composants-principaux)
7. [Sécurité](#7-sécurité)
   - 7.1 [Authentification JWT](#71-authentification-jwt)
   - 7.2 [Hachage des mots de passe](#72-hachage-des-mots-de-passe)
   - 7.3 [Contrôle d'accès par rôle (RBAC)](#73-contrôle-daccès-par-rôle-rbac)
   - 7.4 [Réinitialisation de mot de passe sécurisée](#74-réinitialisation-de-mot-de-passe-sécurisée)
   - 7.5 [Protection des routes frontend](#75-protection-des-routes-frontend)
8. [Modèle de données](#8-modèle-de-données)
9. [Flux de données principaux](#9-flux-de-données-principaux)
10. [Design et interface utilisateur](#10-design-et-interface-utilisateur)
11. [Fonctionnalités implémentées](#11-fonctionnalités-implémentées)
12. [Lancer le projet](#12-lancer-le-projet)

---

## 1. Présentation générale

**TaskFlow Manager** est une application web de gestion collaborative de tâches et de projets. Elle permet à des équipes de créer des projets, d'y inviter des membres, d'organiser les tâches via un tableau Kanban, de gérer des fichiers joints, et de recevoir des notifications en temps réel.

### Objectifs fonctionnels

| Fonctionnalité | Description |
|---|---|
| Authentification | Inscription, connexion, mot de passe oublié, réinitialisation |
| Gestion de projets | Création, suppression, gestion de couleur de thème |
| Membres & invitations | Invitation par email, rôles (Admin / Membre), transfert de rôle |
| Gestion de tâches | CRUD complet, statuts (TODO / IN_PROGRESS / DONE / ARCHIVED), priorités |
| Tableau Kanban | Vue colonne par statut au sein de chaque projet |
| Fichiers joints | Upload, preview, téléchargement de fichiers liés aux tâches |
| Notifications | Alertes en temps réel (délais de tâches), gestion lire/supprimer |
| Administration | Panneau admin : gestion des utilisateurs, tâches globales, journaux d'audit |
| Profil utilisateur | Modification du nom, email, mot de passe, photo de profil (avatar) |

---

## 2. Architecture globale

L'application suit une architecture **Client-Serveur** découplée :

```
┌──────────────────────────────────────────────────────────────┐
│                     NAVIGATEUR (Client)                      │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │          Angular 21 (SPA — Single Page App)         │   │
│   │  Components · Services · Guards · HTTP Interceptors │   │
│   └───────────────────────┬─────────────────────────────┘   │
│                           │  HTTP/REST (JSON)                │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      SERVEUR (Backend)                       │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Express.js (Node.js)                    │   │
│   │   Middlewares · Routes · Controllers · Services      │   │
│   └───────────────────────┬─────────────────────────────┘   │
│                           │  Sequelize ORM                   │
│   ┌───────────────────────▼─────────────────────────────┐   │
│   │                  Base de données                     │   │
│   │         SQLite (dev) / PostgreSQL (prod)             │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  Stockage Fichiers                   │   │
│   │             /uploads (disque local)                  │   │
│   └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │   SMTP (Gmail)   │
                  │   Nodemailer     │
                  └──────────────────┘
```

**Communication :**
- Le frontend Angular envoie des requêtes HTTP à l'API REST backend.
- Chaque requête protégée transporte un **token JWT** dans le header `Authorization: Bearer <token>`.
- Le backend valide le token, exécute la logique métier, interagit avec la base via Sequelize, et renvoie du JSON.

---

## 3. Technologies utilisées

### Backend

| Technologie | Version | Rôle |
|---|---|---|
| **Node.js** | 20+ | Runtime JavaScript côté serveur |
| **Express.js** | 4.19 | Framework HTTP, routage, middlewares |
| **Sequelize ORM** | 6.37 | Mapping objet-relationnel (ORM) |
| **SQLite3** | 5.1.7 | Base de données embarquée (développement) |
| **PostgreSQL / pg** | 8.16 | Base de données (production) |
| **bcryptjs** | 3.0.3 | Hachage des mots de passe (bcrypt, salt×10) |
| **jsonwebtoken** | 9.0.3 | Génération et vérification des tokens JWT |
| **Multer** | 1.4.5 | Gestion des uploads de fichiers (multipart/form-data) |
| **Nodemailer** | 8.0 | Envoi d'emails transactionnels (SMTP Gmail) |
| **dotenv** | 17.2 | Gestion des variables d'environnement |
| **cors** | 2.8.5 | Cross-Origin Resource Sharing |
| **body-parser** | 1.20 | Parsing des corps de requêtes JSON |
| **crypto** (Node natif) | — | Génération de tokens de réinitialisation |

### Frontend

| Technologie | Version | Rôle |
|---|---|---|
| **Angular** | 21.0 | Framework SPA (Standalone Components) |
| **TypeScript** | 5.9 | Langage typé pour Angular |
| **RxJS** | 7.8 | Programmation réactive (Observables) |
| **Angular Signals** | 21.0 | Gestion d'état réactive moderne |
| **Angular CDK** | 21.1 | Composants utilitaires (drag & drop potentiel) |
| **Chart.js** | 4.5 | Visualisation de données (statistiques) |
| **SCSS (Sass)** | — | Styles avec variables, nesting, mixins |
| **Google Fonts** (Inter, Outfit) | — | Typographie premium |
| **Material Icons** | — | Icônes (via CDN Google) |

---

## 4. Structure du projet

```
projet-dev-web/
├── backend/                         # Serveur Express.js
│   ├── config/
│   │   └── database.js              # Connexion Sequelize
│   ├── controllers/
│   │   ├── auth.controller.js       # Register / Login / Forgot & Reset password
│   │   ├── task.controller.js       # CRUD tâches + permissions
│   │   ├── project.controller.js    # CRUD projets + membres + invitations
│   │   ├── file.controller.js       # Upload / Download / Preview
│   │   ├── notification.controller.js # Gestion des notifications
│   │   └── user.controller.js       # Profil utilisateur + administration
│   ├── middlewares/
│   │   ├── auth.middleware.js       # Vérification du JWT (authenticateToken)
│   │   └── role.middleware.js       # Contrôle du rôle global (checkRole)
│   ├── models/
│   │   ├── index.js                 # Associations entre modèles
│   │   ├── User.js                  # Modèle utilisateur
│   │   ├── Project.js               # Modèle projet
│   │   ├── ProjectMember.js         # Table de jointure projet↔utilisateur
│   │   ├── ProjectInvitation.js     # Invitations par email
│   │   ├── Task.js                  # Modèle tâche
│   │   ├── File.js                  # Modèle fichier joint
│   │   ├── Notification.js          # Modèle notification
│   │   └── ActivityLog.js           # Journaux d'audit
│   ├── routes/
│   │   └── api.js                   # Toutes les routes REST
│   ├── services/
│   │   ├── email.service.js         # Envoi d'emails HTML premium
│   │   └── audit.service.js         # Enregistrement des logs d'activité
│   ├── uploads/                     # Fichiers uploadés (servis statiquement)
│   ├── server.js                    # Point d'entrée du serveur
│   ├── database.sqlite              # Fichier BDD SQLite
│   └── .env                         # Variables d'environnement (secrets)
│
├── frontend/                        # Application Angular
│   └── src/
│       └── app/
│           ├── components/
│           │   ├── auth-layout/     # Page connexion/inscription (double panneau)
│           │   ├── auth/            # Forgot-password, Reset-password
│           │   ├── dashboard/       # Shell principal (sidebar + header)
│           │   ├── dashboard-overview/ # Page d'accueil du dashboard
│           │   ├── projects/        # Liste des projets + détail Kanban
│           │   ├── task-list/       # Vue tabulaire de toutes les tâches
│           │   ├── task-detail/     # Modal de création / modification de tâche
│           │   ├── file-list/       # Gestion des fichiers
│           │   ├── notifications-page/ # Page des notifications
│           │   ├── user-profile/    # Profil et paramètres
│           │   ├── admin-users/     # Admin : gestion utilisateurs
│           │   ├── admin-tasks/     # Admin : toutes les tâches
│           │   ├── admin-logs/      # Admin : journaux d'audit
│           │   ├── toast/           # Composant de notifications toast
│           │   ├── loader/          # Indicateur de chargement
│           │   └── confirm-dialog/  # Dialogue de confirmation
│           ├── auth.service.ts      # Service d'authentification + Signals
│           ├── api.service.ts       # Service HTTP principal (tasks, files…)
│           ├── project.service.ts   # Service HTTP dédié projets
│           ├── app.routes.ts        # Configuration du routeur + Guards
│           └── app.config.ts        # Configuration globale Angular
│
├── uploads/                         # Uploads servis publiquement
└── DOCUMENTATION_TASKFLOW.md        # Ce document
```

---

## 5. Backend — API REST (Node.js / Express)

### 5.1 Serveur et configuration

Le fichier `server.js` est le point d'entrée du backend. Il configure :

- **CORS** : autorise les requêtes depuis `http://localhost:4200` (frontend Angular)
- **Body-parser** : parse les corps de requêtes JSON
- **Fichiers statiques** : le dossier `/uploads` est exposé publiquement sous `/uploads`
- **Logging** : un middleware maison log chaque requête entrant avec timestamp et méthode
- **Détection des tâches en retard** : un `setInterval` de 60 secondes vérifie les tâches dont `dueDate` est dépassée et génère automatiquement des notifications
- **Synchronisation Sequelize** : `sequelize.sync()` synchronise les modèles avec la BDD au démarrage

```javascript
// Variables d'environnement (.env)
PORT=3000
DB_DIALECT=sqlite       // ou 'postgres' pour la production
JWT_SECRET=<secret>
SMTP_USER=<gmail>
SMTP_PASS=<app_password>
```

La configuration de la base de données est gérée dans `config/database.js` via Sequelize, supportant aussi bien SQLite (développement local) que PostgreSQL (production), piloté par `DB_DIALECT` dans le `.env`.

---

### 5.2 Base de données et modèles

L'application utilise **Sequelize ORM** pour représenter les entités et leurs relations sous forme de classes JavaScript.

#### Modèle `User`
| Champ | Type | Contrainte |
|---|---|---|
| `id` | INTEGER | PK, auto-increment |
| `username` | STRING | Unique, 3–50 caractères |
| `email` | STRING | Unique, validation email |
| `password` | STRING | Haché (bcrypt) |
| `role` | ENUM | `USER` ou `ADMIN`, défaut `USER` |
| `avatarUrl` | STRING | Nullable (chemin image profil) |
| `resetPasswordToken` | STRING | Nullable (token temporaire) |
| `resetPasswordExpires` | DATE | Nullable (expiration du token) |

#### Modèle `Project`
| Champ | Type | Description |
|---|---|---|
| `id` | INTEGER | PK |
| `name` | STRING | Nom du projet |
| `description` | TEXT | Description du projet |
| `ownerId` | INTEGER | FK → User (propriétaire) |
| `color` | STRING | Couleur de thème (hex, défaut `#6366f1`) |

#### Modèle `ProjectMember` (table de jointure)
| Champ | Type | Description |
|---|---|---|
| `projectId` | INTEGER | FK → Project |
| `userId` | INTEGER | FK → User |
| `role` | ENUM | `ADMIN` ou `MEMBER` (niveau projet) |

#### Modèle `ProjectInvitation`
| Champ | Type | Description |
|---|---|---|
| `projectId` | INTEGER | FK → Project |
| `email` | STRING | Email de l'invité |
| `token` | STRING | Token unique de l'invitation |
| `status` | ENUM | `PENDING`, `ACCEPTED`, `EXPIRED` |
| `role` | ENUM | Rôle attribué à l'acceptation |

#### Modèle `Task`
| Champ | Type | Description |
|---|---|---|
| `id` | INTEGER | PK |
| `title` | STRING | Titre (obligatoire) |
| `description` | TEXT | Description (optionnelle) |
| `status` | ENUM | `TODO`, `IN_PROGRESS`, `DONE`, `ARCHIVED` |
| `priority` | ENUM | `LOW`, `MEDIUM`, `HIGH`, défaut `MEDIUM` |
| `dueDate` | DATE | Date d'échéance |
| `assignedUserId` | INTEGER | FK → User (nullable) |
| `projectId` | INTEGER | FK → Project (nullable) |
| `userId` | INTEGER | FK → User (créateur) |

#### Modèle `File`
| Champ | Type | Description |
|---|---|---|
| `filename` | STRING | Nom de fichier sur le disque |
| `originalName` | STRING | Nom original de l'upload |
| `mimeType` | STRING | Type MIME |
| `size` | INTEGER | Taille en octets |
| `path` | STRING | Chemin complet sur le serveur |
| `userId` | INTEGER | FK → User (uploadeur) |
| `taskId` | INTEGER | FK → Task (fichier lié à une tâche) |

#### Modèle `Notification`
| Champ | Description |
|---|---|
| `message` | Texte de la notification |
| `isRead` | Boolean, défaut `false` |
| `userId` | Destinataire |

#### Modèle `ActivityLog`
| Champ | Description |
|---|---|
| `action` | Ex : `CREATE_TASK`, `UPLOAD_FILE`, `DELETE_USER` |
| `entityType` | Ex : `TASK`, `FILE`, `USER` |
| `entityId` | ID de l'entité concernée |
| `userId` | Utilisateur à l'origine de l'action |

#### Associations (fichier `models/index.js`)

```
User ──(1:N)──> Project        (ownerId)
User <──(N:M)──> Project       (via ProjectMember)
Project ──(1:N)──> Task        (CASCADE DELETE)
Project ──(1:N)──> ProjectInvitation (CASCADE DELETE)
User ──(1:N)──> Task           (userId = créateur)
User ──(1:N)──> Task           (assignedUserId = assigné)
Task ──(1:N)──> File           (CASCADE DELETE)
User ──(1:N)──> File
User ──(1:N)──> Notification   (CASCADE DELETE)
User ──(1:N)──> ActivityLog
```

---

### 5.3 Routes API

Toutes les routes sont préfixées par `/api`. Le middleware `authenticateToken` protège l'ensemble des routes (sauf les routes publiques d'authentification).

#### Routes publiques
| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Inscription |
| `POST` | `/api/auth/login` | Connexion → retourne JWT |
| `POST` | `/api/auth/forgot-password` | Envoi email de réinitialisation |
| `POST` | `/api/auth/reset-password` | Réinitialisation avec token |

#### Routes protégées (utilisateur connecté)
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profile` | Récupérer son profil |
| `POST` | `/api/profile/avatar` | Upload d'avatar |
| `GET` | `/api/users` | Lister les utilisateurs (pour l'assignation) |
| `GET` | `/api/projects` | Mes projets (propriétaire + membre) |
| `POST` | `/api/projects` | Créer un projet |
| `GET` | `/api/projects/:id` | Détail d'un projet |
| `DELETE` | `/api/projects/:id` | Supprimer un projet |
| `POST` | `/api/projects/:id/invite` | Inviter un membre |
| `POST` | `/api/projects/accept-invitation` | Accepter une invitation |
| `PUT` | `/api/projects/:id/members/:userId/role` | Modifier le rôle d'un membre |
| `GET` | `/api/tasks` | Mes tâches (paginées, filtrables) |
| `GET` | `/api/tasks/stats` | Statistiques des tâches |
| `POST` | `/api/tasks` | Créer une tâche |
| `PUT` | `/api/tasks/:id` | Modifier une tâche |
| `DELETE` | `/api/tasks/:id` | Supprimer une tâche |
| `POST` | `/api/upload` | Upload de fichier |
| `GET` | `/api/files` | Lister mes fichiers |
| `GET` | `/api/download/:filename` | Télécharger un fichier |
| `GET` | `/api/files/preview/:filename` | Prévisualiser un fichier |
| `GET` | `/api/notifications` | Mes notifications |
| `PUT` | `/api/notifications/:id/read` | Marquer comme lue |
| `PUT` | `/api/notifications/read-all` | Tout marquer comme lu |
| `DELETE` | `/api/notifications/:id` | Supprimer une notification |

#### Routes Admin uniquement (`checkRole(['ADMIN'])`)
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/users` | Tous les utilisateurs |
| `PUT` | `/api/admin/users/:id` | Modifier un utilisateur |
| `DELETE` | `/api/admin/users/:id` | Supprimer un utilisateur |
| `GET` | `/api/admin/logs` | Journaux d'audit |

---

### 5.4 Contrôleurs

#### `auth.controller.js`
- **`register`** : hache le mot de passe avec bcrypt (rounds: 10), crée l'utilisateur, envoie un email de bienvenue HTML formaté.
- **`login`** : vérifie les credentials, génère un JWT signé (`{ id, username, role }`, expiration 2h).
- **`forgotPassword`** : génère un token hexadécimal aléatoire (20 octets via `crypto.randomBytes`), le stocke en BDD avec une expiration d'1 heure, envoie un email avec lien de reset.
- **`resetPassword`** : vérifie que le token est valide et non expiré, hache le nouveau mot de passe, invalide le token.

#### `task.controller.js`
- **`getTasks`** : retourne les tâches de l'utilisateur (filtre par statut, priorité, recherche, pagination). Un administrateur voit toutes les tâches.
- **`getStats`** : compte les tâches par statut (`TODO`, `IN_PROGRESS`, `DONE`, `ARCHIVED`).
- **`createTask`** : crée une tâche. Si `assignedUserId` diffère de l'utilisateur courant, vérifie que celui-ci est **propriétaire ou admin** du projet.
- **`updateTask`** : modifie une tâche. Logique de permissions à deux niveaux :
  1. **Accès général** : admin global, créateur de la tâche, assigné de la tâche, propriétaire du projet, ou admin du projet.
  2. **Réassignation** : uniquement le propriétaire ou admin du projet peut changer l'assigné.
- **`deleteTask`** : supprime une tâche. Seul le créateur, un admin global, ou le propriétaire du projet peut supprimer.

#### `project.controller.js`
- **`getMyProjects`** : retourne les projets dont l'utilisateur est propriétaire **ou** membre, avec les membres associés.
- **`createProject`** : crée un projet avec `ownerId = req.user.id`.
- **`getProjectDetails`** : retourne le détail complet (tâches, membres, invitations). Accessible uniquement aux membres et au propriétaire.
- **`inviteMember`** : génère un token d'invitation unique, envoie un email HTML avec lien. Seuls le propriétaire et les admins du projet peuvent inviter.
- **`acceptInvitation`** : valide le token, ajoute l'utilisateur comme membre avec le rôle défini dans l'invitation.
- **`updateMemberRole`** : seul le propriétaire peut modifier les rôles. Le rôle du propriétaire lui-même ne peut pas être modifié.
- **`deleteProject`** : seul le propriétaire ou un admin global peut supprimer.

#### `notification.controller.js`
- Gestion CRUD des notifications de l'utilisateur connecté.
- Contrôle que l'utilisateur ne peut accéder qu'à ses propres notifications.

#### `file.controller.js`
- **`uploadFile`** : reçoit le fichier via Multer, enregistre les métadonnées en BDD, log l'activité via `audit.service.js`.
- **`downloadFile`** : vérifie que le fichier appartient à l'utilisateur, force le téléchargement.
- **`previewFile`** : renvoie le fichier pour prévisualisation (PDF, images) avec le bon type MIME.

#### `user.controller.js`
- **`getProfile`** : retourne le profil de la session courante.
- **`updateAvatar`** : upload de l'image de profil, mise à jour de `avatarUrl` en BDD.
- **`listUsers`** : liste simplifiée (id, username) pour la dropdown d'assignation des tâches.
- **`getAllUsers`** *(admin)* : liste complète avec email, rôle, date de création.
- **`updateUser`** *(admin)* : modification du rôle ou du mot de passe d'un utilisateur.
- **`deleteUser`** *(admin)* : suppression d'un compte utilisateur.
- **`getActivityLogs`** *(admin)* : consultation des journaux d'audit avec informations de l'utilisateur.

---

### 5.5 Services transverses

#### `email.service.js`
Service d'envoi d'email utilisant **Nodemailer** configuré avec le SMTP Gmail :
- `sendEmail(to, subject, text, html)` : méthode générique d'envoi asynchrone.
- `getPremiumTemplate(title, content, buttonText, buttonUrl)` : génère un template HTML élaboré avec header dégradé, carte blanche, bouton CTA et footer — utilisé pour les emails de bienvenue, réinitialisation de mot de passe, et invitations.

#### `audit.service.js`
Service d'audit transverse :
- `logActivity(action, entityType, entityId, userId)` : insère une entrée dans `ActivityLog` à chaque action sensible (création de tâche, upload de fichier, etc.). Utilisé dans les contrôleurs après les opérations réussies.

---

## 6. Frontend — Application Angular

### 6.1 Architecture Angular

Le frontend est une **Single Page Application (SPA)** développée avec **Angular 21** en mode **Standalone Components** (sans NgModules). Chaque composant importe ses propres dépendances, ce qui réduit le couplage et améliore le tree-shaking.

L'architecture **Signals** d'Angular est utilisée dans `AuthService` pour réagir aux changements d'état d'authentification de façon réactive et synchrone, sans Observable.

---

### 6.2 Routing et Guards

Le fichier `app.routes.ts` définit l'intégralité des routes de l'application.

```
/                         → redirige vers /auth
/auth                     → AuthLayoutComponent (guestGuard)
/forgot-password          → ForgotPasswordComponent (guestGuard)
/reset-password/:token    → ResetPasswordComponent (guestGuard)
/accept-invitation        → AcceptInvitationComponent (authGuard)
/dashboard                → DashboardComponent (authGuard)
  /                       → DashboardOverviewComponent
  /tasks                  → TaskListComponent
  /files                  → FileListComponent
  /notifications          → NotificationsPage
  /profile                → UserProfile
  /projects               → ProjectsListComponent
  /projects/:id           → ProjectDetailComponent
  /admin/users            → AdminUsersComponent (adminGuard)
  /admin/tasks            → AdminTasksComponent (adminGuard)
  /admin/logs             → AdminLogsComponent (adminGuard)
/**                       → redirige vers /auth
```

**Trois guards fonctionnels** (sans classe, injected directement) :

| Guard | Condition | Comportement |
|---|---|---|
| `authGuard` | `AuthService.isLoggedIn()` = true | Autorise ; sinon, redirige vers `/auth` |
| `adminGuard` | `currentUser().role === 'ADMIN'` | Autorise ; sinon, redirige vers `/dashboard` |
| `guestGuard` | `AuthService.isLoggedIn()` = false | Autorise ; sinon, redirige vers `/dashboard` |

---

### 6.3 Services Angular

#### `AuthService` (`auth.service.ts`)
- Gère la session : stockage du token JWT et des données utilisateur dans `localStorage`.
- Expose deux **Signals** : `currentUser` (objet `AuthUser | null`) et `isLoggedIn` (boolean).
- Méthodes : `login()`, `register()`, `logout()`, `getToken()`, `updateCurrentUser()`, `forgotPassword()`, `resetPassword()`.
- À la connexion, le token et l'utilisateur sont sauvegardés, puis l'utilisateur est redirigé vers `/dashboard`.

#### `ApiService` (`api.service.ts`)
Service centralisé pour toutes les interactions avec le backend. Injecte `HttpClient` et utilise `AuthService.getToken()` pour construire les en-têtes `Authorization`. Expose des méthodes pour :
- Tâches : `getTasks()`, `createTask()`, `updateTask()`, `deleteTask()`, `getStats()`
- Fichiers : `uploadFile()`, `getFiles()`
- Utilisateurs : `listUsers()`, `getProfile()`, `updateAvatar()`
- Notifications : `getNotifications()`, `markAsRead()`, `deleteNotification()`
- Administration : `getAllUsersAdmin()`, `updateUserAdmin()`, `getActivityLogs()`

#### `ProjectService` (`project.service.ts`)
Dédié aux projets : `getMyProjects()`, `createProject()`, `getProjectDetails()`, `inviteMember()`, `acceptInvitation()`, `updateMemberRole()`, `deleteProject()`.

#### `ToastService` (intégré dans `toast.component.ts`)
Service de notifications UI : `showSuccess()`, `showError()`, `showInfo()`. Les toasts s'affichent en haut à droite avec une animation d'entrée, une barre de couleur selon le type, et disparaissent automatiquement après 4 secondes.

---

### 6.4 Composants principaux

#### `AuthLayoutComponent`
Composant d'authentification à **double panneau animé**. Le panneau gauche présente le formulaire de connexion ou d'inscription, le panneau droit une illustration. Un bouton permet de basculer entre les deux modes avec une animation CSS de glissement. Utilise `ReactiveFormsModule` avec validation (longueur minimale, email, confirmation de mot de passe).

#### `DashboardComponent`
**Shell principal** de l'application qui contient :
- **Sidebar** : navigation verticale avec logo, liens de navigation groupés (général, projets, admin), avatar utilisateur, bouton de déconnexion. La sidebar est **repliable** (mode collapsed affichant uniquement les icônes). Sur mobile, elle se cache et surgit via un bouton burger.
- **Header** : barre du haut avec bouton burger mobile, barre de recherche, bouton notifications, avatar.
- **`<router-outlet>`** : zone de contenu dynamique où les routes enfants sont rendues.
- Gère l'état `isMobileOpen` pour le menu mobile et `isCollapsed` pour le mode réduit.

#### `DashboardOverviewComponent`
Page d'accueil après connexion :
- Salutation personnalisée avec heure de la journée.
- Grille de **statistiques** (tâches à faire, en cours, terminées, archivées) via Chart.js.
- Liste des tâches récentes et des projets de l'utilisateur.

#### `ProjectsListComponent`
- Affiche les projets sous forme de **cartes visuelles** avec couleur de thème, nombre de membres, date.
- Carte "+3D hover" avec effet de `rotateX/Y` et lumière radiale suivant la souris.
- **Modal de création** de projet avec choix de couleur par pastilles colorées.
- Menu contextuel (trois points) pour supprimer un projet.

#### `ProjectDetailComponent`
Vue détaillée d'un projet :
- **Header coloré** avec icône, nom du projet, membres empilés.
- **Panneau gauche** : liste des membres avec leur rôle, sélecteur de rôle pour le propriétaire, liste des invitations en attente.
- **Tableau Kanban** (3 colonnes : À faire, En cours, Terminées) avec les tâches organisées par statut.
- Bouton "Ajouter une tâche" ouvrant le composant `TaskDetailComponent` en modale.

#### `TaskDetailComponent`
Modal de création et de modification des tâches :
- **Mode lecture** : affiche le titre, badges (statut/priorité), date d'échéance, assigné, description, fichiers joints.
- **Mode édition** : formulaire avec titre, priorité, statut, date d'échéance, sélection de l'assigné (dropdown avec rôles affichés : Propriétaire / Admin / Membre).
- Gestion des fichiers : upload, liste des fichiers, téléchargement. Sur mobile, se comporte comme un **bottom sheet** (slide depuis le bas).
- Reçoit `ownerId` en `@Input()` pour identifier correctement le propriétaire du projet dans la dropdown.

#### `TaskListComponent`
Vue tabulaire de toutes les tâches :
- **Barre de filtres** : statut, priorité, recherche textuelle.
- **Tableau paginé** avec colonnes : statut, titre, priorité, projet, assigné, date d'échéance, actions.
- Colonnes masquées sur mobile pour s'adapter aux petits écrans.
- **Statistiques** en haut de page (4 cartes de stats colorées).

#### `UserProfile`
- Affichage du profil avec avatar, nom, email, rôle, date d'inscription.
- Formulaire d'édition du nom, email, mot de passe.
- Upload d'une nouvelle photo de profil.

#### Composants d'administration
- **`AdminUsersComponent`** : tableau avec tous les utilisateurs, modification du rôle, suppression de comptes.
- **`AdminTasksComponent`** : vue de toutes les tâches (tous utilisateurs), filtres avancés.
- **`AdminLogsComponent`** : journal chronologique des actions (qui a fait quoi et quand).

#### `ToastComponent`
Notifications UI flottantes en haut à droite de l'écran. Supporte trois types :
- ✅ `success` (vert) : confirmation d'une action réussie
- ❌ `error` (rouge) : erreur lors d'une opération
- ℹ️ `info` (bleu) : information générale

---

## 7. Sécurité

### 7.1 Authentification JWT

**JWT (JSON Web Token)** est utilisé pour authentifier toutes les requêtes API protégées.

**Processus :**
1. À la connexion, le backend génère un token signé avec `JWT_SECRET` contenant `{ id, username, role }`, expirant dans **2 heures**.
2. Le token est retourné au client et stocké dans `localStorage`.
3. Pour chaque requête protégée, Angular envoie le token dans le header : `Authorization: Bearer <token>`.
4. Le middleware `authenticateToken` extrait et vérifie le token. En cas d'absence → `401 Unauthorized`. En cas de token invalide/expiré → `403 Forbidden`.
5. L'objet `req.user` est alimenté avec les données du token, accessible dans tous les contrôleurs.

```
Client                    Backend
  |                          |
  |-- POST /auth/login ----→ |
  |← { token, user } -------| (JWT signé, expire 2h)
  |                          |
  |-- GET /api/tasks ------→ |
  |   Authorization: Bearer  |
  |   <token>                |
  |                          |-- authenticateToken middleware
  |                          |   jwt.verify(token, JWT_SECRET)
  |                          |   → req.user = { id, username, role }
  |← { data } --------------| (si valide)
```

### 7.2 Hachage des mots de passe

Les mots de passe ne sont **jamais stockés en clair**. Ils sont hachés avec **bcryptjs** (algorithme bcrypt) avec un facteur de coût de **10 rounds** (salt factor).

```javascript
// Inscription
const hashedPassword = await bcrypt.hash(password, 10);

// Vérification à la connexion
const isValid = await bcrypt.compare(plainPassword, user.password);
```

Le bcrypt intègre nativement un sel aléatoire par hachage, rendant les attaques par rainbow tables inefficaces.

### 7.3 Contrôle d'accès par rôle (RBAC)

L'application implémente un contrôle d'accès à **deux niveaux** :

#### Niveau global (plateforme)
| Rôle | Accès |
|---|---|
| `USER` | Accès à ses propres ressources (tâches, projets, fichiers) |
| `ADMIN` | Accès à toutes les ressources, gestion des utilisateurs |

Implémenté via le middleware `checkRole(['ADMIN'])` appliqué aux routes `/admin/*`.

#### Niveau projet
| Rôle Projet | Droits |
|---|---|
| **Propriétaire** | Tous droits : inviter, modifier rôles, supprimer le projet, assigner des tâches |
| **Admin** | Inviter des membres, assigner et réassigner des tâches |
| **Membre** | Voir le projet, créer des tâches (pour soi-même), modifier ses propres tâches |

Ces vérifications sont effectuées **dans les contrôleurs** en consultant la table `ProjectMember` :

```javascript
// Exemple dans task.controller.js — updateTask
const isGlobalAdmin = role == 'ADMIN';
const isTaskOwner   = task.userId == userId;
const isTaskAssignee = task.assignedUserId == userId;
const isProjectOwner = project && project.ownerId == userId;
const membership = await ProjectMember.findOne({ where: { projectId, userId } });
const isProjectAdmin = membership && membership.role == 'ADMIN';

if (!isGlobalAdmin && !isTaskOwner && !isTaskAssignee && !isProjectOwner && !isProjectAdmin) {
    return res.status(403).json({ error: 'Droits insuffisants pour modifier cette tâche' });
}
```

**Distinction 401 vs 403 :**
- `401 Unauthorized` : aucun token (session inexistante).
- `403 Forbidden` : token valide mais droits insuffisants pour l'action demandée.

Cette distinction est importante côté frontend : un `401` déclenche la déconnexion, un `403` affiche simplement un toast d'erreur sans interrompre la session.

### 7.4 Réinitialisation de mot de passe sécurisée

1. L'utilisateur soumet son email.
2. Le backend génère un token aléatoire avec `crypto.randomBytes(20).toString('hex')`.
3. Le token et sa date d'expiration (1 heure) sont stockés en BDD sur l'utilisateur.
4. Un email HTML avec lien `http://localhost:4200/reset-password/<token>` est envoyé.
5. À la réinitialisation, le token est vérifié ET sa date d'expiration vérifiée (`Op.gt: Date.now()`).
6. Le nouveau mot de passe est haché, le token est invalidé (`null`).

### 7.5 Protection des routes frontend

Les guards Angular empêchent l'accès non autorisé aux routes protégées **côté client** :

- **`authGuard`** : toutes les routes `/dashboard/**` nécessitent d'être connecté.
- **`adminGuard`** : les routes `/dashboard/admin/**` nécessitent le rôle `ADMIN`.
- **`guestGuard`** : les routes `/auth`, `/forgot-password`, `/reset-password/:token` redirigent vers `/dashboard` si déjà connecté.

*Note : ces guards sont une protection UX. La sécurité réelle des données repose sur le backend.*

---

## 8. Modèle de données

Diagramme entité-relations simplifié :

```
┌──────────┐       ┌──────────────┐       ┌─────────┐
│   User   │──1:N──├ ProjectMember├──N:1──│ Project │
│──────────│       │──────────────│       │─────────│
│ id       │       │ projectId    │       │ id      │
│ username │       │ userId       │       │ name    │
│ email    │       │ role (ADMIN/ │       │ ownerId │──→ User
│ password │       │ MEMBER)      │       │ color   │
│ role     │       └──────────────┘       └────┬────┘
│ avatarUrl│                                    │ 1:N
└─────┬────┘                              ┌────▼────┐
      │ 1:N (creator)               ┌────►│  Task   │
      │ 1:N (assignee)              │     │─────────│
      │                        1:N  │     │ id      │
      ▼                             │     │ title   │
┌──────────┐       ┌──────────┐    │     │ status  │
│   File   │◄──N:1─│  Task    │◄───┘     │ priority│
│──────────│       └──────────┘          │ dueDate │
│ filename │                             │ userId  │──→ User
│ taskId   │                             │ assigned│──→ User
│ userId   │                             │ projectId│
└──────────┘       ┌────────────────┐   └──────────┘
                   │ Notification   │
┌────────────────┐ │────────────────│
│ ActivityLog    │ │ message        │
│────────────────│ │ isRead         │
│ action         │ │ userId ──→ User│
│ entityType     │ └────────────────┘
│ entityId       │
│ userId ─→ User │
└────────────────┘
```

---

## 9. Flux de données principaux

### Connexion utilisateur
```
1. Saisie username + password (AuthLayoutComponent)
2. AuthService.login() → POST /api/auth/login
3. Backend : vérifie BDD → bcrypt.compare → jwt.sign
4. Retour : { token, id, username, role, ... }
5. AuthService : stockage localStorage + mise à jour Signals
6. Navigation automatique vers /dashboard
```

### Création d'une tâche dans un projet
```
1. Clic "Ajouter une tâche" (ProjectDetailComponent)
2. Ouverture de TaskDetailComponent (modale)
3. Saisie : titre, priorité, statut, date, assigné
4. Clic "Enregistrer" → ApiService.createTask()
5. POST /api/tasks (avec Authorization: Bearer <token>)
6. Backend : authenticateToken → taskController.createTask
   - Vérifie si assignation autorisée (owner/admin)
   - Task.create({ ..., projectId, userId })
   - Retour 201 + tâche créée
7. Frontend : rechargement des tâches du projet
8. Toast "Tâche créée avec succès"
```

### Invitation d'un membre
```
1. Propriétaire clique "Inviter" dans ProjectDetailComponent
2. Saisie email + sélection du rôle (Admin / Membre)
3. ProjectService.inviteMember(projectId, email, role)
4. POST /api/projects/:id/invite
5. Backend :
   - Vérifie que l'utilisateur est owner ou admin du projet
   - Si email déjà enregistré → crée directement la membership
   - Sinon → génère token, crée ProjectInvitation, envoie email
6. Email reçu avec lien /accept-invitation?token=xxx
7. L'invité clique → AcceptInvitationComponent
8. POST /api/projects/accept-invitation → création du ProjectMember
```

---

## 10. Design et interface utilisateur

### Identité visuelle

- **Palette principale** : Indigo (`#6366f1`) / Violet (`#8b5cf6`) — couleurs de la famille "primary"
- **Fond** : `#0f172a` (slate-900) — mode sombre profond
- **Cartes** : `rgba(30, 41, 59, 0.6)` avec `backdrop-filter: blur()` — effet glassmorphism
- **Typographie** : **Inter** (corps de texte, labels), **Outfit** (titraille)

### Effets visuels notables
- **Glassmorphism** : fond semi-transparent + blur sur toutes les cartes et modales
- **Effet spotlight** : un gradient radial suit la souris dans la sidebar
- **Curseur personnalisé** : curseur circulaire avec anneau (désactivé sur mobile)
- **Hover 3D** sur les cartes de projet : `rotateX/Y` avec perspective
- **Bottom-sheet** modal sur mobile : les modales surgissent du bas de l'écran
- **Animations d'entrée** : `fadeIn`, `slideIn` sur les toasts et modales
- **Particles/grain** : overlay texture légère (3% opacité) sur toute l'interface

### Responsive Design
L'application est entièrement responsive avec des breakpoints à :
- **≤ 1024px** : les colonnes latérales passent sous le contenu principal
- **≤ 768px** : sidebar cachée (burger menu), padding réduit, grilles en 1 colonne, header adapté
- **≤ 480px** : stats en 2 colonnes, colonnes de tableau masquées, barre de recherche cachée

---

## 11. Fonctionnalités implémentées

### Authentification
- [x] Inscription avec email de bienvenue HTML
- [x] Connexion avec JWT (2h d'expiration)
- [x] Mot de passe oublié (email avec lien)
- [x] Réinitialisation de mot de passe (token temporaire 1h)
- [x] Déconnexion

### Projets
- [x] Création avec choix de couleur de thème
- [x] Suppression (propriétaire ou admin global)
- [x] Vue détaillée avec Kanban (3 colonnes)
- [x] Invitation par email (propriétaire ou admin)
- [x] Acceptation d'invitation par lien
- [x] Gestion des rôles des membres (Admin / Membre)

### Tâches
- [x] Création, modification, suppression
- [x] Statuts : À faire, En cours, Terminée, Archivée
- [x] Priorités : Basse, Moyenne, Haute
- [x] Assignation à un membre du projet
- [x] Vue Kanban dans les projets
- [x] Vue tabulaire paginée globale
- [x] Filtres (statut, priorité, recherche)
- [x] Statistiques (compteurs par statut)
- [x] Détection automatique des tâches en retard (notifications)

### Fichiers
- [x] Upload de fichiers joints aux tâches
- [x] Téléchargement sécurisé
- [x] Prévisualisation (PDF, images)

### Notifications
- [x] Notifications automatiques pour les tâches en retard
- [x] Marquer comme lue (individuelle / toutes)
- [x] Suppression individuelle

### Profil utilisateur
- [x] Modification du nom d'utilisateur
- [x] Modification de l'email
- [x] Modification du mot de passe
- [x] Upload de photo de profil (avatar)

### Administration (rôle ADMIN)
- [x] Liste de tous les utilisateurs
- [x] Modification du rôle d'un utilisateur
- [x] Suppression d'un utilisateur
- [x] Vue de toutes les tâches
- [x] Journal d'audit (qui a fait quoi et quand)

---

## 12. Lancer le projet

### Prérequis
- Node.js ≥ 18
- npm ≥ 9

### Backend

```bash
cd backend

# Copier et configurer les variables d'environnement
cp .env.example .env
# Modifier .env avec vos valeurs (JWT_SECRET, SMTP_USER, SMTP_PASS)

# Installer les dépendances
npm install

# Démarrer le serveur
node server.js
# → Serveur disponible sur http://localhost:3000
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npx ng serve -o
# → Application disponible sur http://localhost:4200
```

### Variables d'environnement (`.env`)

| Variable | Description | Exemple |
|---|---|---|
| `PORT` | Port du serveur Express | `3000` |
| `DB_DIALECT` | Dialecte BDD | `sqlite` ou `postgres` |
| `JWT_SECRET` | Clé secrète JWT | `une_chaine_aleatoire_longue` |
| `SMTP_USER` | Email Gmail pour l'envoi | `moncompte@gmail.com` |
| `SMTP_PASS` | Mot de passe d'app Gmail | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | Nom affiché dans les emails | `"TaskFlow" <moncompte@gmail.com>` |

> **Note SMTP Gmail** : utiliser un "mot de passe d'application" Google (pas le mot de passe principal), à générer dans les paramètres du compte Google sous Sécurité > Authentification à 2 facteurs > Mots de passe des applications.

---

*Documentation générée le 22 février 2026.*
