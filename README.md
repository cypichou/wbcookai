# WBCookAI — mes repas de la semaine

Site de planification de repas : on choisit des recettes pour la semaine,
le site additionne les ingrédients et produit une liste de courses groupée
par rayon du magasin.

Stack : React + TypeScript + Vite (site), Express (API), MySQL (base).

## Démarrage complet depuis zéro

Il faut Docker, Node.js (22+) et Git.

### 1. Démarrer la base MySQL (Docker)

```bash
docker run --name CookContainer -d -p 3306:3306 \
  -e MYSQL_USER=admin \
  -e MYSQL_PASSWORD=admin \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=cook \
  mysql
```

Si le conteneur existe déjà, il suffit de le démarrer :

```bash
docker start CookContainer
```

Vérification : `docker ps` doit montrer `CookContainer` avec le port
`0.0.0.0:3306->3306/tcp`, et la base doit répondre dans l'onglet Database
de WebStorm (host `127.0.0.1`, port `3306`, user `admin`, mot de passe
`admin`, base `cook`).

### 2. Initialiser la base

La première fois (base vide), appliquer le schéma et les données de
démarrage contenus dans [server/schema.sql](server/schema.sql) :

```bash
docker exec -i CookContainer mysql -u admin -padmin cook < server/schema.sql
```

### 3. Lancer l'API (port 3000)

Dans un terminal :

```bash
cd server
npm install
npm start
```

Message attendu : `API démarrée sur http://localhost:3000`.

### 4. Lancer le site (port 5173)

Dans un second terminal, à la racine du projet :

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173.

### Production (facultatif)

```bash
npm run build      # compile dans dist/
npx vite preview  # sert dist/ en local
```

## Structure du projet

- `src/` — le site React (pages : Accueil, sélection des recettes,
  liste de courses, formulaire d'ajout)
- `server/` — l'API Express (`index.js`), la connexion MySQL (`db.js`),
  le schéma de la base (`schema.sql`) et un mémo de requêtes (`requetes.sql`)

## Dépannage

- « Impossible de charger les recettes » → l'API n'est pas démarrée
  (étape 3) ou le conteneur MySQL est arrêté (étape 1).
- Erreur SQL au démarrage de l'API → la base n'est pas initialisée
  (étape 2).
