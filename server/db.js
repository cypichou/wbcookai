// db.js — la seule connexion à MySQL de l'API.
// On crée un "pool" : mysql2 ouvre plusieurs connexions à l'avance et les
// réutilise, au lieu d'en ouvrir une neuve à chaque requête HTTP.

import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'admin',
  password: 'admin',
  database: 'cook',
  // utf8mb4 : même charset que le serveur (les accents passent sans surprise)
  charset: 'utf8mb4',
})
