# Formly  Constructeur de formulaires conversationnels

**Formly** est une application web permettant de créer, gérer et publier des formulaires interactifs sous forme de conversations. Elle offre un espace d'administration pour construire des formulaires et consulter les réponses, ainsi qu'une interface publique permettant aux utilisateurs de répondre aux questions.

Le projet utilise une architecture séparant le frontend, le backend et la base de données afin de faciliter la maintenance et l'évolution de l'application.

## Fonctionnalités

- **Tableau de bord** : centraliser les formulaires et suivre leur activité.
- **Création de formulaires** : construire des formulaires personnalisés à partir de questions.
- **Modification des formulaires** : mettre à jour le contenu d'un formulaire existant.
- **Publication et partage** : rendre un formulaire accessible via un lien public.
- **Formulaires conversationnels** : permettre aux répondants de répondre aux questions dans une interface de type chatbot.
- **Gestion des réponses** : enregistrer les soumissions et consulter les réponses depuis l'espace d'administration.
- **Suppression des formulaires** : supprimer les formulaires dont on n'a plus besoin.
- **Accueil personnalisé** : demander un prénom et afficher un message de bienvenue avant d'accéder à l'espace d'administration.

> **État du projet :** MVP en développement. Certaines fonctionnalités et données sont encore en cours d'intégration avec Supabase.

## Technologies utilisées

| Technologie | Utilisation |
|---|---|
| React | Interface utilisateur |
| TypeScript | Typage statique et fiabilité du code |
| Vite | Développement et compilation du frontend |
| Next.js | Backend et routes API |
| Supabase | Base de données PostgreSQL |
| Zod | Validation des données côté backend |
| CSS | Mise en forme et design de l'interface |

## Architecture

L'application suit une architecture en trois parties :

```text
┌─────────────────────────────┐
│     Frontend React + Vite   │
│                             │
│ Dashboard · Builder         │
│ Responses · Chatbot         │
└──────────────┬──────────────┘
               │ Requêtes HTTP
               ▼
┌─────────────────────────────┐
│       Backend Next.js       │
│                             │
│ Routes API · Validation     │
│ Traitement des requêtes     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          Supabase           │
│                             │
│ PostgreSQL                  │
│ forms · submissions         │
└─────────────────────────────┘
```

Le frontend communique avec le backend à travers des requêtes HTTP. Le backend traite et valide les données avant d'interagir avec Supabase. Le frontend n'a donc pas besoin d'accéder directement à la base de données.

## Installation

### Prérequis

Avant de commencer, installez :

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- Un compte [Supabase](https://supabase.com/)

### 1. Cloner le dépôt

```bash
git clone URL_DE_VOTRE_REPO
cd NOM_DU_REPO
```

Remplacez `URL_DE_VOTRE_REPO` et `NOM_DU_REPO` par les informations de votre dépôt.

### 2. Installer les dépendances

Installez les dépendances dans le dossier du frontend et dans celui du backend, selon l'organisation de votre dépôt :

```bash
npm install
```

Exécutez cette commande dans chaque projet Node.js concerné.

### 3. Configurer Supabase

1. Créez un projet sur [Supabase](https://supabase.com/).
2. Ouvrez l'éditeur SQL de votre projet.
3. Créez les tables nécessaires aux formulaires et à leurs soumissions.
4. Récupérez l'URL du projet et les clés nécessaires depuis les paramètres Supabase.
5. Configurez les variables d'environnement utilisées par le backend.

Exemple de fichier `.env.local` dans le projet Next.js :

```env
SUPABASE_URL=https://VOTRE_PROJET.supabase.co
SUPABASE_SERVICE_ROLE_KEY=VOTRE_CLE_SECRETE
```

Les noms des variables doivent correspondre à ceux utilisés dans le code du backend. **La clé `SERVICE_ROLE` est strictement réservée au serveur : ne la placez jamais dans le frontend, dans une variable `VITE_*` ou dans le dépôt Git.**

Configurez également les politiques de sécurité de la base de données selon les accès prévus par l'application.

### 4. Démarrer le backend

Dans le dossier du backend Next.js :

```bash
npm run dev
```

Le backend est configuré pour fonctionner sur le port `3000` dans l'environnement de développement du projet.

### 5. Démarrer le frontend

Dans un second terminal, ouvrez le dossier du frontend React + Vite, puis exécutez :

```bash
npm run dev
```

Le frontend est configuré pour fonctionner sur le port `8443` dans l'environnement de développement du projet. Vérifiez le port effectivement affiché par Vite au démarrage.

## Structure fonctionnelle des données

Les principales entités de la base de données sont :

### `forms`

Contient les informations des formulaires, notamment leur contenu, leurs questions et les données nécessaires à leur gestion et à leur publication.

### `submissions`

Contient les soumissions associées aux formulaires et les réponses fournies par les utilisateurs.

La structure exacte des colonnes doit correspondre au schéma SQL et aux types utilisés dans le backend.

## Parcours utilisateur

1. L'utilisateur ouvre Formly.
2. Il accède à l'espace d'administration après avoir saisi son prénom dans le MVP actuel.
3. Il crée un formulaire ou modifie un formulaire existant.
4. Il publie le formulaire et partage son lien.
5. Les répondants ouvrent le lien et remplissent le formulaire via l'interface conversationnelle.
6. Les réponses sont enregistrées et peuvent être consultées dans la section **Responses**.

## Authentification

La saisie du prénom constitue actuellement une personnalisation de l'expérience utilisateur. Elle ne représente pas une authentification sécurisée : aucune identité n'est vérifiée et cette étape ne protège pas les routes API ni les données Supabase.

Une véritable authentification pourra être ajoutée ultérieurement, par exemple avec Supabase Auth, ainsi qu'un système d'autorisations permettant de limiter l'accès aux formulaires et aux réponses.

## Sécurité et configuration

- Ne commitez jamais vos fichiers `.env.local`.
- Ajoutez les fichiers d'environnement au `.gitignore`.
- Ne transmettez jamais une clé secrète Supabase au navigateur.
- Validez les données reçues par les routes API.
- Configurez des règles d'accès adaptées aux formulaires et aux réponses.
- Ne considérez pas le pseudo-login actuel comme une protection des données.

## Améliorations prévues

- Remplacer les données statiques restantes par des données chargées depuis Supabase.
- Finaliser et tester les opérations de création, lecture, modification et suppression des formulaires.
- Fiabiliser l'enregistrement et l'affichage des soumissions.
- Ajouter une authentification réelle et une gestion des autorisations.
- Améliorer les statistiques du tableau de bord.
- Renforcer la validation et la gestion des erreurs côté frontend et backend.

## Contribution

Les contributions et suggestions d'amélioration sont les bienvenues. Pour proposer une évolution :

1. Créez une branche dédiée.
2. Effectuez vos modifications.
3. Testez le frontend et le backend.
4. Soumettez une Pull Request décrivant les changements.

## Licence

Aucune licence n'est spécifiée pour le moment. Ajoutez un fichier `LICENSE` au dépôt si vous souhaitez définir les conditions de réutilisation du projet.
