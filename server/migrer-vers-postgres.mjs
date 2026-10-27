// migrer-vers-postgres.mjs — copie les données de la base MySQL locale
// (celle du conteneur Docker CookContainer) vers la base PostgreSQL.
//
// Usage :
//   node migrer-vers-postgres.mjs
//
// La destination se règle avec DATABASE_URL (défaut : le conteneur Docker
// cook-postgres). Ce même script servira plus tard pour viser Neon :
//   DATABASE_URL="postgres://...neon.tech/cook?sslmode=require" node migrer-vers-postgres.mjs

import mysql from 'mysql2/promise'
import pg from 'pg'

const MYSQL_URL = process.env.MYSQL_URL ?? 'mysql://admin:admin@127.0.0.1:3306/cook'
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://admin:admin@localhost:5432/cook'

// Ordre respectant les clés étrangères : les parents avant les enfants.
// Chaque entrée : [table, colonnes, colonne identité (pour setval)]
const TABLES = [
  ['saisons', ['id', 'nom'], 'id'],
  ['timings', ['id', 'nom'], 'id'],
  ['categories', ['id', 'nom', 'unite', 'rayon'], 'id'],
  ['outils', ['id_outil', 'nom'], 'id_outil'],
  ['recettes', ['id', 'nom', 'temps_de_preparation', 'consignes', 'image_url', 'prix', 'id_saison', 'vegetarien'], 'id'],
  ['ingredients', ['id', 'nom', 'glucides', 'lipides', 'calories', 'id_saison', 'id_categorie', 'proteines'], 'id'],
  ['recettes_ingredients', ['id_recette', 'id_ingredient', 'quantite'], null],
  ['recette_outils', ['id_outil', 'id_recette'], null],
  ['utilisateurs', ['id', 'nom', 'prenom', 'sexe', 'mail', 'mdp', 'activite', 'objectifs', 'calories', 'proteines', 'lipides', 'glucides'], 'id'],
  ['recettes_semaine', ['id_semaine', 'jour', 'moment', 'id_recette'], 'id_semaine'],
  ['semaines_pref', ['nom', 'id_user', 'id_semaine'], null],
  ['utilisateurs_recettes', ['utilisateur_id', 'recette_id'], null],
]

const mysqlPool = mysql.createPool(MYSQL_URL)
const pgPool = new pg.Pool({ connectionString: DATABASE_URL })

try {
  for (const [table, colonnes, colonneId] of TABLES) {
    const [lignes] = await mysqlPool.query(`SELECT ${colonnes.join(', ')} FROM ${table}`)
    if (lignes.length > 0) {
      // une ligne paramétrée par INSERT, valeurs passées à pg (pas de concaténation)
      const placeholders = lignes.map((_, i) => `(${colonnes.map((_, j) => `$${i * colonnes.length + j + 1}`).join(', ')})`).join(', ')
      const valeurs = lignes.flatMap((l) => colonnes.map((c) => l[c]))
      await pgPool.query(
        `INSERT INTO ${table} (${colonnes.join(', ')}) VALUES ${placeholders}`,
        valeurs,
      )
    }
    // réaligner la séquence d'identité sur le plus grand id copié,
    // pour que le prochain INSERT auto génère id = max + 1
    if (colonneId) {
      await pgPool.query(
        `SELECT setval(pg_get_serial_sequence('${table}', '${colonneId}'), COALESCE((SELECT MAX(${colonneId}) FROM ${table}), 1))`,
      )
    }
    console.log(`${table} : ${lignes.length} ligne(s) copiée(s)`)
  }
  console.log('Migration terminée.')
} finally {
  await mysqlPool.end()
  await pgPool.end()
}
