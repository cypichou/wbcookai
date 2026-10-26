// index.js — l'API complète : 3 routes, rien d'autre.
// Express gère le HTTP, db.js gère MySQL, on assemble ici.

import express from 'express'
import cors from 'cors'
import { pool } from './db.js'

const app = express()
app.use(cors()) // autorise le site (localhost:5173) à appeler cette API
app.use(express.json()) // permet de lire le corps JSON des POST

// Une erreur de validation = c'est la faute des données reçues (400).
// Toute autre erreur = c'est la faute du serveur (500). Distinguer les
// deux évite d'afficher "erreur interne" pour un simple champ manquant.
class ErreurValidation extends Error {}

// ---------------------------------------------------------------------------
// GET /api/meta — le catalogue des listes déroulantes du site
// (saisons, équipements, rayons, unités). Sert aux formulaires.
// ---------------------------------------------------------------------------
app.get('/api/meta', async (_req, res) => {
  const [saisons] = await pool.query('SELECT id, nom FROM saisons ORDER BY id')
  const [outils] = await pool.query('SELECT id_outil AS id, nom FROM outils ORDER BY id_outil')
  // DISTINCT : on ne veut chaque rayon/unité qu'une fois, même si
  // plusieurs catégories les partagent.
  const [rayons] = await pool.query('SELECT DISTINCT rayon FROM categories WHERE rayon IS NOT NULL')
  const [unites] = await pool.query('SELECT DISTINCT unite FROM categories WHERE unite IS NOT NULL')
  // les ingrédients connus, avec leur rayon et leur unité : sert à
  // l'autocomplétion du champ "Nom" du formulaire d'ajout de recette.
  const [ingredients] = await pool.query(`
    SELECT i.id, i.nom, c.unite, c.rayon
    FROM ingredients i
    LEFT JOIN categories c ON c.id = i.id_categorie
    ORDER BY i.nom
  `)
  res.json({
    saisons,
    outils,
    rayons: rayons.map((r) => r.rayon),
    unites: unites.map((u) => u.unite),
    ingredients,
  })
})

// ---------------------------------------------------------------------------
// GET /api/recettes — toutes les recettes avec leurs ingrédients
// ---------------------------------------------------------------------------
// Deux requêtes jointes (pas une par recette), chacune "à plat" :
//   1. recettes + ingrédients (avec la catégorie, pour déduire végétarien)
//      + saison de la recette
//   2. recettes + outils
// puis on assemble le tout en JavaScript avec un reduce.
// Le "végétarien" est déduit : une recette est végétarienne si aucun de ses
// ingrédients n'appartient aux catégories Viande (1) ou Poisson (3).
app.get('/api/recettes', async (_req, res) => {
  const [lignes] = await pool.query(`
    SELECT r.id, r.nom, r.temps_de_preparation, r.consignes, r.image_url,
           r.prix, r.id_saison, s.nom AS saison_nom,
           r.vegetarien AS vegetarien_explicite,
           i.id          AS ingredient_id,
           i.nom         AS ingredient_nom,
           i.id_categorie AS ingredient_categorie,
           c.unite       AS ingredient_unite,
           ri.quantite
    FROM recettes r
    LEFT JOIN saisons s ON s.id = r.id_saison
    LEFT JOIN recettes_ingredients ri ON ri.id_recette = r.id
    LEFT JOIN ingredients i ON i.id = ri.id_ingredient
    LEFT JOIN categories c ON c.id = i.id_categorie
    ORDER BY r.id, i.id
  `)

  const [lignesOutils] = await pool.query(`
    SELECT ro.id_recette, o.id_outil, o.nom AS outil_nom
    FROM recette_outils ro
    JOIN outils o ON o.id_outil = ro.id_outil
    ORDER BY ro.id_recette, o.id_outil
  `)

  // map idRecette -> [nom des outils], pour ne pas faire de 3e boucle
  const outilsParRecette = new Map()
  for (const l of lignesOutils) {
    if (!outilsParRecette.has(l.id_recette)) outilsParRecette.set(l.id_recette, [])
    outilsParRecette.get(l.id_recette).push({ id: l.id_outil, nom: l.outil_nom })
  }

  const recettes = lignes.reduce((acc, l) => {
    let recette = acc.find((r) => r.id === l.id)
    if (!recette) {
      recette = {
        id: l.id,
        nom: l.nom,
        temps_de_preparation: l.temps_de_preparation,
        consignes: l.consignes,
        image_url: l.image_url,
        prix: l.prix,
        saison: l.id_saison ? { id: l.id_saison, nom: l.saison_nom } : null,
        // végétarien explicite si la colonne est remplie (recettes créées
        // via le formulaire) ; sinon on déduira depuis les catégories
        vegetarien: l.vegetarien_explicite === null ? true : !!l.vegetarien_explicite,
        outils: outilsParRecette.get(l.id) ?? [],
        ingredients: [],
      }
      acc.push(recette)
    }
    // LEFT JOIN : une recette sans ingrédient donne une ligne avec
    // ingredient_nom = NULL, on ne l'ajoute pas au tableau.
    if (l.ingredient_nom !== null) {
      // déduction, seulement quand la colonne vegetarien n'a rien dit :
      // catégories 1 = Viande, 3 = Poisson -> la recette n'est pas végétarienne
      if (
        l.vegetarien_explicite === null &&
        (l.ingredient_categorie === 1 || l.ingredient_categorie === 3)
      ) {
        recette.vegetarien = false
      }
      recette.ingredients.push({
        id: l.ingredient_id,
        nom: l.ingredient_nom,
        quantite: l.quantite,
        id_categorie: l.ingredient_categorie,
        unite: l.ingredient_unite,
      })
    }
    return acc
  }, [])

  res.json(recettes)
})

// ---------------------------------------------------------------------------
// POST /api/recettes — crée une recette avec ses ingrédients et ses outils
// ---------------------------------------------------------------------------
// Corps attendu :
// {
//   "nom": "Chili con carne",
//   "temps_de_preparation": 45,
//   "consignes": "...",
//   "image_url": null,
//   "prix": 5.5,
//   "id_saison": 7,
//   "vegetarien": false,
//   "outils": [1, 3],                              // ids d'outils
//   "ingredients": [
//     { "nom": "Poulet", "quantite": 200, "rayon": "Protéines", "unite": "gr" },
//     { "nom": "haricot rouge", "quantite": 400, "id_categorie": 10 }
//   ]
// }
// Chaque ingrédient est relié par (rayon, unite) — les deux vivent sur la
// catégorie en base — ou directement par id_categorie. Si le duo
// (rayon, unite) n'existe pas, on crée la catégorie. Si l'ingrédient
// existe déjà (comparaison insensible à la casse grâce à la collation
// utf8mb4_0900_ai_ci), on réutilise son id. Tout se fait dans une
// transaction : si un insert échoue, rien n'est écrit.
app.post('/api/recettes', async (req, res) => {
  const { nom, temps_de_preparation, consignes, image_url, prix, id_saison, vegetarien, outils, ingredients } = req.body

  if (!nom || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ erreur: 'Champs requis : nom (string) et ingredients (tableau non vide)' })
  }
  for (const ing of ingredients) {
    const categorieOk = ing.id_categorie !== undefined || (ing.rayon && ing.unite)
    if (!ing.nom || typeof ing.quantite !== 'number' || ing.quantite <= 0 || !categorieOk) {
      return res.status(400).json({
        erreur: 'Chaque ingrédient doit avoir un nom, une quantite > 0, et une catégorie (id_categorie, ou rayon + unite)',
      })
    }
  }
  const idsOutils = Array.isArray(outils) ? outils : []
  if (idsOutils.some((id) => !Number.isInteger(id))) {
    return res.status(400).json({ erreur: 'outils doit être un tableau d\'identifiants entiers' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // les ids reçus doivent exister : on le vérifie AVANT d'écrire,
    // pour renvoyer un message clair plutôt qu'une erreur de clé
    // étrangère au milieu de la transaction
    if (id_saison != null) {
      const [s] = await conn.query('SELECT id FROM saisons WHERE id = ?', [id_saison])
      if (s.length === 0) throw new ErreurValidation('Saison inconnue : ' + id_saison)
    }
    if (idsOutils.length > 0) {
      // IN (?) avec un tableau : mysql2 insère autant de points
      // d'interrogation que de valeurs, chacun échappé
      const [o] = await conn.query('SELECT COUNT(*) AS n FROM outils WHERE id_outil IN (?)', [idsOutils])
      if (o[0].n !== idsOutils.length) {
        throw new ErreurValidation('Au moins un des outils est inconnu')
      }
    }

    const [resultat] = await conn.query(
      'INSERT INTO recettes (nom, temps_de_preparation, consignes, image_url, prix, id_saison, vegetarien) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        nom,
        temps_de_preparation ?? null,
        consignes ?? null,
        image_url ?? null,
        prix ?? null,
        id_saison ?? null,
        vegetarien == null ? null : vegetarien ? 1 : 0,
      ]
    )
    const idRecette = resultat.insertId

    // Après normalisation, deux lignes du formulaire peuvent désigner le
    // même ingrédient ("tomate" et "tomates") : on additionne leurs
    // quantités dans une map avant d'écrire, pour ne créer qu'une ligne
    // par ingrédient (la clé primaire de recettes_ingredients l'exige).
    const quantites = new Map() // idIngredient -> quantité totale
    for (const ing of ingredients) {
      // 1) résoudre la catégorie : id direct, ou duo (rayon, unite)
      let idCategorie
      if (ing.id_categorie !== undefined) {
        idCategorie = ing.id_categorie
      } else {
        const [cats] = await conn.query(
          'SELECT id FROM categories WHERE rayon = ? AND unite = ?',
          [ing.rayon, ing.unite]
        )
        if (cats.length > 0) {
          idCategorie = cats[0].id
        } else {
          idCategorie = (
            await conn.query('INSERT INTO categories (nom, unite, rayon) VALUES (?, ?, ?)', [
              null,
              ing.unite,
              ing.rayon,
            ])
          )[0].insertId
        }
      }

      // 2) retrouver l'ingrédient par son nom, ou le créer.
      //    La collation de la base (utf8mb4_0900_ai_ci) rend la comparaison
      //    insensible à la casse et aux accents : "TOMATE", "tomate" ou
      //    "tomaté" retrouvent tous l'ingrédient "Tomate". Reste le pluriel :
      //    pour éviter une ligne "tomates" à côté de la ligne "tomate" dans
      //    la liste de courses, si le singulier existe déjà on le réutilise.
      const nomIngredient = ing.nom.trim()
      const [existants] = await conn.query('SELECT id FROM ingredients WHERE nom = ?', [nomIngredient])
      let idIngredient = null
      if (existants.length > 0) {
        idIngredient = existants[0].id
      } else if (/[sx]$/.test(nomIngredient)) {
        const [singuliers] = await conn.query('SELECT id FROM ingredients WHERE nom = ?', [
          nomIngredient.slice(0, -1),
        ])
        if (singuliers.length > 0) idIngredient = singuliers[0].id
      }
      if (idIngredient === null) {
        idIngredient = (
          await conn.query('INSERT INTO ingredients (nom, id_categorie) VALUES (?, ?)', [
            nomIngredient,
            idCategorie,
          ])
        )[0].insertId
      }
      quantites.set(idIngredient, (quantites.get(idIngredient) ?? 0) + ing.quantite)
    }

    // une seule ligne par ingrédient, avec la quantité additionnée
    for (const [idIngredient, quantite] of quantites) {
      await conn.query(
        'INSERT INTO recettes_ingredients (id_recette, id_ingredient, quantite) VALUES (?, ?, ?)',
        [idRecette, idIngredient, quantite]
      )
    }

    // 4) les outils nécessaires
    for (const idOutil of idsOutils) {
      await conn.query('INSERT INTO recette_outils (id_outil, id_recette) VALUES (?, ?)', [
        idOutil,
        idRecette,
      ])
    }

    await conn.commit()
    res.status(201).json({ id: idRecette, nom, message: 'Recette créée' })
  } catch (err) {
    await conn.rollback()
    if (err instanceof ErreurValidation) {
      res.status(400).json({ erreur: err.message })
    } else {
      res.status(500).json({ erreur: 'Erreur lors de la création : ' + err.message })
    }
  } finally {
    conn.release()
  }
})

// ---------------------------------------------------------------------------
// POST /api/liste-courses — additionne les ingrédients des recettes choisies
// ---------------------------------------------------------------------------
// Corps attendu : { "recettes": [ { "id": 4, "quantite": 2 }, { "id": 9 } ] }
// ("quantite" manquante = 1 fois la recette)
//
// Le gros du travail (l'addition) est fait par MySQL, pas par JavaScript.
// On construit une petite table temporaire en mémoire avec (VALUES ROW...)
// qui contient la sélection, on la joint aux ingrédients, et on laisse
// GROUP BY + SUM faire l'addition — ligne par ligne :
//   quantite de l'ingrédient dans la recette × nombre de fois la recette.
// Le GROUP BY porte sur (rayon, nom d'ingrédient, unité) : deux ingrédients
// de même nom mais d'unités différentes ne sont jamais mélangés.
app.post('/api/liste-courses', async (req, res) => {
  const selection = req.body?.recettes
  if (!Array.isArray(selection) || selection.length === 0) {
    return res.status(400).json({ erreur: 'Corps attendu : { "recettes": [ { "id": 1, "quantite": 2 }, ... ] }' })
  }

  const lignes = selection.map((r) => ({
    id: r.id,
    multiplicateur: r.quantite ?? 1,
  }))
  if (lignes.some((l) => !Number.isInteger(l.id) || l.multiplicateur <= 0)) {
    return res.status(400).json({ erreur: 'Chaque recette doit avoir un id (entier) et une quantite > 0' })
  }

  // (VALUES ROW(?, ?), ROW(?, ?)) : une ligne par recette sélectionnée,
  // avec un "?" par valeur -> mysql2 échappe tout, pas d'injection SQL.
  const valeurs = lignes.flatMap((l) => [l.id, l.multiplicateur])
  const placeholders = lignes.map(() => 'ROW(?, ?)').join(', ')

  const [resultats] = await pool.query(
    `
    SELECT c.rayon AS rayon,
           i.nom  AS ingredient,
           c.unite AS unite,
           SUM(ri.quantite * sel.multiplicateur) AS total
    FROM (VALUES ${placeholders}) AS sel(id_recette, multiplicateur)
    JOIN recettes_ingredients ri ON ri.id_recette = sel.id_recette
    JOIN ingredients i           ON i.id = ri.id_ingredient
    LEFT JOIN categories c       ON c.id = i.id_categorie
    GROUP BY c.rayon, i.nom, c.unite
    ORDER BY c.rayon, i.nom
    `,
    valeurs
  )

  // Il ne reste qu'à regrouper les lignes par rayon pour la réponse JSON.
  const parRayon = resultats.reduce((acc, l) => {
    const rayon = l.rayon ?? 'Sans rayon'
    if (!acc[rayon]) acc[rayon] = []
    acc[rayon].push({ ingredient: l.ingredient, unite: l.unite, total: l.total })
    return acc
  }, {})

  res.json(parRayon)
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`)
})
