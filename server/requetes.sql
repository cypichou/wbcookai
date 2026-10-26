-- requetes.sql — les requêtes de l'API, prêtes à être exécutées
-- dans la console SQL de WebStorm (connexion : host 127.0.0.1, port 3306,
-- user "admin", mot de passe "admin", base "cook").
--
-- Le "?1" et "?2" de la requête de liste de courses sont remplacés par des
-- valeurs concrètes : ici "Pates pesto" (id 4) x2 et "Tarte flambée" (id 9) x1.

-- 1. Toutes les recettes avec leurs ingrédients (lignes "à plat",
--    1 ligne = 1 ingrédient d'1 recette — c'est ce que reçoit l'API GET).
--    La deuxième requête ci-dessous récupère les outils, que l'API
--    assemble ensuite avec le reste en JavaScript.
SELECT r.id, r.nom, r.temps_de_preparation, r.consignes, r.image_url,
       r.prix, r.id_saison, s.nom AS saison_nom,
       i.id   AS ingredient_id,
       i.nom  AS ingredient_nom,
       i.id_categorie,
       ri.quantite
FROM recettes r
LEFT JOIN saisons s ON s.id = r.id_saison
LEFT JOIN recettes_ingredients ri ON ri.id_recette = r.id
LEFT JOIN ingredients i ON i.id = ri.id_ingredient
ORDER BY r.id, i.id;

SELECT ro.id_recette, o.id_outil, o.nom AS outil_nom
FROM recette_outils ro
JOIN outils o ON o.id_outil = ro.id_outil
ORDER BY ro.id_recette, o.id_outil;

-- 2. L'addition de la liste de courses, faite par MySQL.
--    La petite table "(VALUES ROW(4, 2), ROW(9, 1))" est la sélection
--    (recette 4 deux fois, recette 9 une fois) : en SQL pur, sans API.
--    Le rayon vient de la colonne categories.rayon (Protéines, Lipides,
--    Épicerie...), modifiable directement en SQL.
SELECT c.rayon AS rayon,
       i.nom   AS ingredient,
       c.unite AS unite,
       SUM(ri.quantite * sel.multiplicateur) AS total
FROM (VALUES ROW(4, 2), ROW(9, 1)) AS sel(id_recette, multiplicateur)
JOIN recettes_ingredients ri ON ri.id_recette = sel.id_recette
JOIN ingredients i           ON i.id = ri.id_ingredient
LEFT JOIN categories c       ON c.id = i.id_categorie
GROUP BY c.rayon, i.nom, c.unite
ORDER BY c.rayon, i.nom;

-- Pour tester l'API elle-même (serveur démarré) :
--   curl http://localhost:3000/api/recettes
--   curl -X POST http://localhost:3000/api/liste-courses -H "Content-Type: application/json" -d "{\"recettes\":[{\"id\":4,\"quantite\":2},{\"id\":9}]}"

-- 3. Le catalogue des listes déroulantes du formulaire
--    (c'est la réponse de GET /api/meta).
SELECT id, nom FROM saisons ORDER BY id;
SELECT id_outil AS id, nom FROM outils ORDER BY id_outil;
SELECT DISTINCT rayon FROM categories WHERE rayon IS NOT NULL;
SELECT DISTINCT unite FROM categories WHERE unite IS NOT NULL;

-- 4. Le parcours d'insertion de POST /api/recettes, étape par étape.
--    (L'API enchaîne tout ceci dans une transaction.)
--    a) retrouver la catégorie à partir du duo (rayon, unité) :
SELECT id FROM categories WHERE rayon = 'Protéines' AND unite = 'gr';
--    b) si rien trouvé, la créer :
INSERT INTO categories (nom, unite, rayon) VALUES (NULL, 'qtt', 'Épicerie');
--    c) retrouver l'ingrédient par son nom (insensible à la casse),
--       sinon le créer :
SELECT id FROM ingredients WHERE nom = 'steak';
-- INSERT INTO ingredients (nom, id_categorie) VALUES ('steak', 1);
--    d) créer la recette puis relier chaque ingrédient :
-- INSERT INTO recettes (nom, temps_de_preparation, prix, id_saison, vegetarien)
--   VALUES ('Chili', 45, 5.5, 7, 0);
-- INSERT INTO recettes_ingredients (id_recette, id_ingredient, quantite) VALUES (12, 1, 200);
-- INSERT INTO recette_outils (id_outil, id_recette) VALUES (3, 12);
