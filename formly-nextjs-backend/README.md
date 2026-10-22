# Formly — backend Next.js + TypeScript + Supabase

Ce dossier fournit un backend API pour le frontend React/Vite `Interactive Form Builder`.
Le frontend actuel est principalement une maquette avec données en mémoire : il faut le relier aux routes ci-dessous pour que les formulaires persistent.

## 1. Architecture

- Frontend existant : React + TypeScript + Vite (généralement `http://localhost:5173`).
- Backend : Next.js App Router + TypeScript (`http://localhost:3000`).
- Base de données : Supabase PostgreSQL.
- Les définitions de questions sont conservées dans `forms.questions` en JSONB pour coller au modèle `Question[]` du frontend.
- Les réponses sont enregistrées dans `submissions.answers` en JSONB.

## 2. Préparer Supabase

1. Crée un projet sur https://supabase.com/dashboard.
2. Dans **Project Settings → API** (ou API Keys), copie l'URL du projet et la clé publishable/anon.
3. Dans la même zone, récupère la clé `service_role` uniquement pour le serveur. Ne la mets jamais dans le frontend ni dans une variable `NEXT_PUBLIC_*`.
4. Dans **SQL Editor → New query**, colle puis exécute `supabase/schema.sql`.
5. Vérifie dans **Table Editor** que `forms` et `submissions` existent.

### Tables

`forms`
- `id`: UUID du formulaire.
- `owner_id`: utilisateur Supabase Auth propriétaire (nullable pour le scaffold sans authentification).
- `title`, `description`, `status`, `color`, `welcome`: propriétés visibles dans l'éditeur.
- `questions`: tableau JSONB contenant les questions et options.
- `created_at`, `updated_at`: dates.

`submissions`
- `id`, `form_id`: réponse et formulaire lié.
- `answers`: objet JSONB dont les clés sont les IDs des questions.
- `source`: `Public link` ou `Website widget`.
- `created_at`: date de réception.

## 3. Démarrer le backend

Depuis ce dossier :

```bash
npm install
cp .env.example .env.local
```

Sous Windows PowerShell, à la place de `cp` :

```powershell
Copy-Item .env.example .env.local
```

Renseigne les variables de `.env.local`, puis :

```bash
npm run dev
```

Teste `http://localhost:3000/api/health` : résultat attendu `{"status":"ok","service":"formly-api"}`.

## 4. Routes disponibles

| Méthode | Route | Fonction |
|---|---|---|
| GET | `/api/forms` | Liste des formulaires |
| POST | `/api/forms` | Crée un formulaire |
| GET | `/api/forms/:id` | Détail d'un formulaire |
| PATCH | `/api/forms/:id` | Met à jour un formulaire |
| DELETE | `/api/forms/:id` | Supprime un formulaire |
| GET | `/api/forms/:id/submissions` | Liste les réponses d'un formulaire |
| POST | `/api/forms/:id/submissions` | Enregistre une réponse à un formulaire publié |

Les routes renvoient les données dans `{ "data": ... }` et les erreurs dans `{ "error": "..." }`.

### Exemple : créer un formulaire

```bash
curl -X POST http://localhost:3000/api/forms ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Feedback produit\",\"description\":\"Votre avis\",\"status\":\"Draft\",\"color\":\"#7156e8\",\"welcome\":\"Bonjour !\",\"questions\":[{\"id\":1,\"type\":\"text\",\"label\":\"Votre nom ?\",\"required\":true}]}"
```

Sur PowerShell, si l'échappement JSON est pénible, utilise Postman/Insomnia ou `Invoke-RestMethod`.

### Exemple : envoyer une réponse

```json
{
  "answers": {
    "1": "Amine",
    "2": "amine@example.com"
  },
  "source": "Public link"
}
```

POST vers `/api/forms/<UUID>/submissions`. Le formulaire doit être publié.

## 5. Relier le frontend React existant

Dans le projet frontend, crée `src/lib/api.ts` :

```ts
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Erreur API");
  return body.data as T;
}

export const api = {
  listForms: () => request<any[]>("/api/forms"),
  getForm: (id: string) => request<any>(`/api/forms/${id}`),
  createForm: (form: unknown) => request<any>("/api/forms", { method: "POST", body: JSON.stringify(form) }),
  updateForm: (id: string, form: unknown) => request<any>(`/api/forms/${id}`, { method: "PATCH", body: JSON.stringify(form) }),
  deleteForm: (id: string) => request<void>(`/api/forms/${id}`, { method: "DELETE" }),
  listSubmissions: (id: string) => request<any[]>(`/api/forms/${id}/submissions`),
  submitAnswers: (id: string, payload: unknown) => request<any>(`/api/forms/${id}/submissions`, { method: "POST", body: JSON.stringify(payload) }),
};
```

Ajoute `VITE_API_URL=http://localhost:3000` au fichier `.env` du frontend, puis redémarre Vite.

Dans `src/App.tsx`, les constantes `starterForms` et `starterSubmissions` sont des données de démonstration. Remplace le chargement local par `api.listForms()` dans un `useEffect`, et remplace les handlers de création/sauvegarde/suppression par `api.createForm`, `api.updateForm` et `api.deleteForm`. Dans `Chatbot`, remplace l'ajout local de réponse par `api.submitAnswers(form.id, { answers: Object.fromEntries(Object.entries(nextAnswers).map(([k,v]) => [String(k), v])), source: "Public link" })`.

### Différences de type à adapter

Le frontend de départ utilise `id: number`, `responses: number` et `updated: string`; la base utilise `id: string` (UUID), `created_at` et `updated_at`. Pour l'intégration :
- passe les identifiants de formulaire React de `number` à `string`;
- affiche `new Date(form.updated_at).toLocaleString()` pour la date;
- calcule le nombre de réponses avec un endpoint d'agrégat ou en chargeant les réponses. En production, préfère un endpoint SQL/RPC d'agrégat pour éviter de charger toutes les réponses;
- les exemples `starterForms` / `starterSubmissions` ne doivent plus servir de source de vérité.

## 6. Sécurité — important avant la mise en production

Ce scaffold est une base de démarrage pédagogique, pas une application prête pour un déploiement public multi-utilisateur.

- **Auth à ajouter avant la mise en production** : le backend utilise `SUPABASE_SERVICE_ROLE_KEY`, qui contourne RLS. Les routes de gestion des formulaires doivent vérifier la session Supabase Auth et filtrer chaque lecture/modification par `owner_id`. Le `TODO` dans `POST /api/forms` indique l'endroit à compléter.
- Les routes de réponses publiques nécessitent une protection anti-spam (limitation de débit, captcha si nécessaire, quotas).
- Les listes de réponses contiennent potentiellement des données personnelles : ne jamais les exposer publiquement.
- N'envoie jamais la clé service role au navigateur et ne la committe pas dans Git.
- Configure CORS si le frontend et le backend sont sur des domaines différents. En développement, `fetch` fonctionne si les deux sont configurés sur la même origine ou si tu ajoutes un proxy Vite ; en déploiement séparé, configure CORS sur les routes ou utilise un proxy. Le backend de ce kit ne configure pas encore CORS.
- Ajoute des tests, une politique de rétention/suppression des données et les mentions de confidentialité adaptées à ton usage.

## 7. Ordre conseillé pour terminer l'intégration

1. Exécuter le SQL.
2. Démarrer l'API et vérifier `/api/health`.
3. Tester création/liste/modification/suppression via Postman.
4. Créer `src/lib/api.ts` dans React et relier le dashboard.
5. Relier le builder à `PATCH`, puis les réponses à `POST`.
6. Ajouter Supabase Auth, ownership, tests et protection anti-spam avant toute publication publique.
