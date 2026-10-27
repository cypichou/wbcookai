// db.js — la seule connexion à la base de l'API.
// On crée un "pool" : pg ouvre plusieurs connexions à l'avance et les
// réutilise, au lieu d'en ouvrir une neuve à chaque requête HTTP.
//
// La connexion se règle avec la variable d'environnement DATABASE_URL.
// En local : le conteneur Docker cook-postgres. En production (Render) :
// l'URL de la base hébergée, passée dans les variables d'environnement.

import pg from 'pg'

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://admin:admin@localhost:5432/cook',
})
