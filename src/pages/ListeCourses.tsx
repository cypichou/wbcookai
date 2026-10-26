// ListeCourses.tsx — la page "Liste de courses".
//
// Elle reçoit d'App le résumé des repas choisis (recette + nombre de fois),
// l'envoie à POST /api/liste-courses au chargement, et affiche :
//   1. le résumé de la semaine en haut,
//   2. les ingrédients additionnés, groupés par rayon, avec une case
//      à cocher par ingrédient pour le barrer en magasin.
// L'addition elle-même est faite par MySQL (voir server/index.js).

import { useEffect, useState } from 'react'
import { genererListeCourses } from '../api'
import { formaterQuantite } from '../format'
import type { ListeParRayon, ResumeRepas } from '../types'

interface ListeCoursesProps {
  resume: ResumeRepas[]
  onRetour: () => void
}

// Ordre de passage du magasin voulu par l'utilisateur. Les rayons
// renvoyés par l'API mais absents de cette liste (ou "Sans rayon")
// sont affichés en fin de liste.
const ORDRE_RAYONS = [
  'Protéines',
  'Féculents',
  'Fruits et légumes',
  'Produits laitiers',
  'Lipides',
  'Épicerie',
  'Condiments',
]

export default function ListeCourses({ resume, onRetour }: ListeCoursesProps) {
  const [liste, setListe] = useState<ListeParRayon | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  // identifiants des lignes cochées ("rayon|ingrédient")
  const [cochees, setCochees] = useState<Set<string>>(new Set())

  useEffect(() => {
    // pas de repas sélectionné : rien à demander à l'API
    if (resume.length === 0) return
    let annule = false

    async function charger() {
      try {
        const reponse = await genererListeCourses(
          resume.map((r) => ({ id: r.id, quantite: r.quantite })),
        )
        if (annule) return
        setListe(reponse)
      } catch {
        if (annule) return
        setErreur(
          "Impossible de générer la liste de courses. Vérifie que l'API est démarrée " +
            '(cd server && npm start) et que le conteneur MySQL est lancé.',
        )
      }
    }

    charger()
    return () => {
      annule = true
    }
  }, [resume])

  function basculer(idLigne: string) {
    setCochees((precedent) => {
      const copie = new Set(precedent)
      if (copie.has(idLigne)) copie.delete(idLigne)
      else copie.add(idLigne)
      return copie
    })
  }

  // Filet de sécurité : on n'arrive normalement jamais ici avec une
  // sélection vide (le bouton est désactivé), mais un rafraîchissement
  // direct sur cette page vide le résumé — autant le dire clairement.
  if (resume.length === 0) {
    return (
      <section className="page-liste">
        <header className="entete-liste">
          <button type="button" className="btn-retour" onClick={onRetour}>
            Retour aux recettes
          </button>
          <h2>Ma liste de courses</h2>
        </header>
        <p className="message-erreur">
          Aucun repas n'est sélectionné. Retourne choisir au moins une recette
          pour générer une liste de courses.
        </p>
      </section>
    )
  }

  if (erreur) {
    return (
      <section className="page-liste">
        <p className="message-erreur">{erreur}</p>
        <button type="button" className="btn-primary" onClick={onRetour}>
          Revenir à la sélection
        </button>
      </section>
    )
  }

  if (liste === null) {
    return (
      <section className="page-liste">
        <p>Génération de la liste de courses…</p>
      </section>
    )
  }

  // rayons dans l'ordre voulu, puis les imprévus éventuels en fin
  const rayonsConnus = ORDRE_RAYONS.filter((r) => (liste[r] ?? []).length > 0)
  const rayonsInconnus = Object.keys(liste).filter((r) => !ORDRE_RAYONS.includes(r))
  const rayonsAffiches = [...rayonsConnus, ...rayonsInconnus]

  return (
    <section className="page-liste">
      <header className="entete-liste">
        <button type="button" className="btn-retour" onClick={onRetour}>
          Retour aux recettes
        </button>
        <h2>Ma liste de courses</h2>
      </header>

      <div className="resume-semaine">
        <h3>Repas de la semaine</h3>
        <ul>
          {resume.map((r) => (
            <li key={r.id}>
              {r.nom} ×{r.quantite}
            </li>
          ))}
        </ul>
      </div>

      {rayonsAffiches.length === 0 ? (
        <p>Ces recettes n'ont aucun ingrédient enregistré.</p>
      ) : (
        rayonsAffiches.map((rayon) => (
          <div key={rayon} className="rayon">
            <h3>{rayon}</h3>
            <ul>
              {liste[rayon].map((ligne) => {
                const idLigne = `${rayon}|${ligne.ingredient}`
                const cochee = cochees.has(idLigne)
                return (
                  <li key={idLigne} className={cochee ? 'ligne cochee' : 'ligne'}>
                    <label>
                      <input
                        type="checkbox"
                        checked={cochee}
                        onChange={() => basculer(idLigne)}
                      />
                      <span className="ingredient">{ligne.ingredient}</span>
                      <span className="quantite">
                        {formaterQuantite(ligne.total, ligne.unite)}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        ))
      )}
    </section>
  )
}
