// SelectionRecettes.tsx — la page "que mange-t-on cette semaine ?"
//
// Au chargement : appel GET /api/recettes, puis affichage d'une carte
// par recette. Les filtres ne re-télégent rien : ils trient la liste
// déjà chargée, en mémoire (voir "recettesFiltrees" plus bas).

import { useEffect, useState } from 'react'
import { chargerRecettes } from '../api'
import { formaterQuantite } from '../format'
import type { Recette } from '../types'

interface SelectionRecettesProps {
  // map id de recette -> nombre de fois choisie (ex. { 4: 2 })
  selection: Record<number, number>
  onAjouter: (id: number) => void
  onRetirer: (id: number) => void
  onRetour: () => void
  // appelé au clic sur "Générer ma liste de courses" : la page transmet
  // le résumé des repas choisis (id, nom, quantité) pour la page suivante
  onGenerer: (resume: { id: number; nom: string; quantite: number }[]) => void
  // appelé au clic sur "Ajouter une recette"
  onAjouterRecette: () => void
}

type FiltreVegetarien = 'indifferent' | 'oui' | 'non'

// Convertit un prix exact en jauge à symboles :
// moins de 3 € = pas cher (€), de 3 à moins de 5 € = moyen (€€),
// 5 € et plus = cher (€€€). Le prix exact reste en base pour le filtre.
function symbolePrix(prix: number): string {
  if (prix < 3) return '€'
  if (prix < 5) return '€€'
  return '€€€'
}
3
export default function SelectionRecettes({
  selection,
  onAjouter,
  onRetirer,
  onRetour,
  onGenerer,
  onAjouterRecette,
}: SelectionRecettesProps) {
  const [recettes, setRecettes] = useState<Recette[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  // recette affichée dans la fenêtre de détails (null = fenêtre fermée)
  const [recetteOuverte, setRecetteOuverte] = useState<Recette | null>(null)

  // ---- état des filtres -------------------------------------------------
  const [saisonChoisie, setSaisonChoisie] = useState<string>('') // '' = toutes
  const [tempsMax, setTempsMax] = useState<string>('') // texte libre, '' = pas de filtre
  const [filtreVegetarien, setFiltreVegetarien] = useState<FiltreVegetarien>('indifferent')
  const [prixMax, setPrixMax] = useState<string>('') // texte libre, '' = pas de filtre
  const [outilsPossedes, setOutilsPossedes] = useState<Set<number>>(new Set())

  // ---- chargement des recettes ------------------------------------------
  useEffect(() => {
    let annule = false // si on quitte la page avant la fin du fetch

    async function charger() {
      try {
        const donnees = await chargerRecettes()
        if (annule) return
        setRecettes(donnees)
        // par défaut on coche tout le matériel : rien n'est filtré
        const ids = new Set<number>()
        for (const r of donnees) {
          for (const o of r.outils) ids.add(o.id)
        }
        setOutilsPossedes(ids)
      } catch {
        if (annule) return
        setErreur(
          "Impossible de charger les recettes. Vérifie que l'API est démarrée " +
            '(cd server && npm start) et que le conteneur MySQL est lancé.',
        )
      }
    }

    charger()
    return () => {
      annule = true
    }
  }, [])

  // la fenêtre de détails se ferme avec la touche Échap
  useEffect(() => {
    if (recetteOuverte === null) return
    function surEchap(e: KeyboardEvent) {
      if (e.key === 'Escape') setRecetteOuverte(null)
    }
    window.addEventListener('keydown', surEchap)
    return () => window.removeEventListener('keydown', surEchap)
  }, [recetteOuverte])

  // ---- LE FILTRE : une seule passe .filter() ----------------------------
  // Chaque critère est un test qui répond true/false ("prédicat").
  // On garde la recette si TOUS les critères renvoient true : c'est le &&
  // implicite des "if ... return false" successifs.
  const recettesFiltrees = (recettes ?? []).filter((r) => {
    if (saisonChoisie !== '' && r.saison?.id !== Number(saisonChoisie)) return false
    if (tempsMax !== '' && (r.temps_de_preparation === null || r.temps_de_preparation > Number(tempsMax)))
      return false
    if (filtreVegetarien === 'oui' && !r.vegetarien) return false
    if (filtreVegetarien === 'non' && r.vegetarien) return false
    if (prixMax !== '' && (r.prix === null || r.prix > Number(prixMax))) return false
    // la recette passe si CHACUN de ses outils est possédé (.every)
    if (!r.outils.every((o) => outilsPossedes.has(o.id))) return false
    return true
  })

  // ---- décompte des repas ------------------------------------------------
  const nbRepas = Object.values(selection).reduce((total, qte) => total + qte, 0)

  // listes pour remplir les filtres (uniques, sans doublon)
  const saisonsUniques = Array.from(
    new Map((recettes ?? []).filter((r) => r.saison).map((r) => [r.saison!.id, r.saison!])).values(),
  )
  const outilsUniques = Array.from(
    new Map((recettes ?? []).flatMap((r) => r.outils).map((o) => [o.id, o])).values(),
  )

  function basculerOutil(id: number) {
    setOutilsPossedes((precedent) => {
      const copie = new Set(precedent)
      if (copie.has(id)) copie.delete(id)
      else copie.add(id)
      return copie
    })
  }

  // remet tous les filtres à zéro (et re-coche tout le matériel)
  function reinitialiserFiltres() {
    setSaisonChoisie('')
    setTempsMax('')
    setFiltreVegetarien('indifferent')
    setPrixMax('')
    const ids = new Set<number>()
    for (const r of recettes ?? []) {
      for (const o of r.outils) ids.add(o.id)
    }
    setOutilsPossedes(ids)
  }

  // au clic : on transforme la sélection (id -> quantité) en résumé
  // lisible (id, nom, quantité) et on le passe à App, qui change de page
  function generer() {
    if (nbRepas === 0) return // le bouton est déjà désactivé, double sécurité
    const resume = recettes!
      .filter((r) => (selection[r.id] ?? 0) > 0)
      .map((r) => ({ id: r.id, nom: r.nom, quantite: selection[r.id] ?? 0 }))
    onGenerer(resume)
  }

  // ---- rendus partiels ----------------------------------------------------
  if (erreur) {
    return (
      <section className="page-selection">
        <p className="message-erreur">{erreur}</p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Réessayer
        </button>
      </section>
    )
  }

  if (recettes === null) {
    return (
      <section className="page-selection">
        <p>Chargement des recettes…</p>
      </section>
    )
  }

  return (
    <section className="page-selection">
      <header className="entete-selection">
        <button type="button" className="btn-retour" onClick={onRetour}>
          Accueil
        </button>
        <h2>Choisis tes repas</h2>
        <span className="compteur-repas">{nbRepas} repas</span>
        <button
          type="button"
          className="btn-primary btn-generer"
          onClick={generer}
          disabled={nbRepas === 0}
        >
          Générer ma liste de courses
        </button>
        <button type="button" className="btn-retour" onClick={onAjouterRecette}>
          Ajouter une recette
        </button>
      </header>

      {nbRepas === 0 && (
        <p className="message-info">
          Ajoute au moins un repas avec le bouton « + » d'une carte pour
          générer ta liste de courses.
        </p>
      )}

      <div className="filtres">
        <label>
          Saison
          <select
            value={saisonChoisie}
            onChange={(e) => setSaisonChoisie(e.target.value)}
          >
            <option value="">Toutes</option>
            {saisonsUniques.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
        </label>

        <label>
          Temps max (min)
          <input
            type="number"
            min="0"
            value={tempsMax}
            onChange={(e) => setTempsMax(e.target.value)}
            placeholder="—"
          />
        </label>

        <label>
          Végétarien
          <select
            value={filtreVegetarien}
            onChange={(e) => setFiltreVegetarien(e.target.value as FiltreVegetarien)}
          >
            <option value="indifferent">Indifférent</option>
            <option value="oui">Oui</option>
            <option value="non">Non</option>
          </select>
        </label>

        <label>
          Prix max (€)
          <input
            type="number"
            min="0"
            step="0.5"
            value={prixMax}
            onChange={(e) => setPrixMax(e.target.value)}
            placeholder="—"
          />
        </label>

        <fieldset className="filtre-outils">
          <legend>Matériel que je possède</legend>
          {outilsUniques.map((o) => (
            <label key={o.id}>
              <input
                type="checkbox"
                checked={outilsPossedes.has(o.id)}
                onChange={() => basculerOutil(o.id)}
              />
              {o.nom}
            </label>
          ))}
        </fieldset>
      </div>

      {recettesFiltrees.length === 0 ? (
        <div className="aucune-recette">
          <p>Aucune recette ne correspond à ces filtres.</p>
          <button type="button" className="btn-retour" onClick={reinitialiserFiltres}>
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grille-cartes">
          {recettesFiltrees.map((r) => {
            const qte = selection[r.id] ?? 0
            return (
              <article
                key={r.id}
                className="carte"
                onClick={() => setRecetteOuverte(r)}
              >
                <h3>{r.nom}</h3>
                <p className="carte-meta">
                  {r.temps_de_preparation !== null && <>{r.temps_de_preparation} min</>}
                  {r.prix !== null && <> · {symbolePrix(r.prix)}</>}
                </p>
                <div className="carte-badges">
                  {r.vegetarien && <span className="badge badge-vegetarien">Végétarien</span>}
                  {r.saison && <span className="badge">{r.saison.nom}</span>}
                  {r.outils.length > 0 && (
                    <span className="badge badge-outils">
                      Nécessite : {r.outils.map((o) => o.nom).join(', ')}
                    </span>
                  )}
                </div>
                <p className="carte-ingredients">
                  {r.ingredients.length > 0
                    ? r.ingredients.map((i) => i.nom).join(', ')
                    : 'Ingrédients non renseignés'}
                </p>
                <div className="carte-actions">
                  <button
                    type="button"
                    className="btn-moins"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRetirer(r.id)
                    }}
                    disabled={qte === 0}
                  >
                    −
                  </button>
                  <span className="carte-quantite">{qte > 0 ? `×${qte}` : ''}</span>
                  <button
                    type="button"
                    className="btn-plus"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAjouter(r.id)
                    }}
                  >
                    +
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {recetteOuverte !== null && (
        <div
          className="fond-modale"
          role="dialog"
          aria-modal="true"
          aria-label={recetteOuverte.nom}
          onClick={() => setRecetteOuverte(null)}
        >
          <article
            className="modale"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="fermer-modale"
              onClick={() => setRecetteOuverte(null)}
              aria-label="Fermer les détails"
            >
              ×
            </button>

            <h3>{recetteOuverte.nom}</h3>
            <p className="carte-meta">
              {recetteOuverte.temps_de_preparation !== null && (
                <>{recetteOuverte.temps_de_preparation} min</>
              )}
              {recetteOuverte.prix !== null && <> · {symbolePrix(recetteOuverte.prix)}</>}
            </p>
            <div className="carte-badges">
              {recetteOuverte.vegetarien && (
                <span className="badge badge-vegetarien">Végétarien</span>
              )}
              {recetteOuverte.saison && <span className="badge">{recetteOuverte.saison.nom}</span>}
              {recetteOuverte.outils.length > 0 && (
                <span className="badge badge-outils">
                  Nécessite : {recetteOuverte.outils.map((o) => o.nom).join(', ')}
                </span>
              )}
            </div>

            {recetteOuverte.consignes !== null && recetteOuverte.consignes !== '' && (
              <div className="modale-note">
                <h4>Préparation</h4>
                <p>{recetteOuverte.consignes}</p>
              </div>
            )}

            {recetteOuverte.ingredients.length > 0 && (
              <div className="modale-ingredients">
                <h4>Ingrédients</h4>
                <ul>
                  {recetteOuverte.ingredients.map((i) => (
                    <li key={i.id}>
                      {i.nom}
                      <span className="modale-quantite">
                        {formaterQuantite(i.quantite, i.unite)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="carte-actions">
              <button
                type="button"
                className="btn-moins"
                onClick={() => onRetirer(recetteOuverte.id)}
                disabled={(selection[recetteOuverte.id] ?? 0) === 0}
              >
                −
              </button>
              <span className="carte-quantite">
                {(selection[recetteOuverte.id] ?? 0) > 0
                  ? `×${selection[recetteOuverte.id]}`
                  : ''}
              </span>
              <button
                type="button"
                className="btn-plus"
                onClick={() => onAjouter(recetteOuverte.id)}
              >
                +
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}
