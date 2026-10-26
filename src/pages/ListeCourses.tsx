// ListeCourses.tsx — la page "Liste de courses".
//
// Elle reçoit d'App le résumé des repas choisis (recette + nombre de fois),
// l'envoie à POST /api/liste-courses au chargement, et affiche :
//   1. le résumé de la semaine en haut,
//   2. les ingrédients additionnés, groupés par rayon, avec une case
//      à cocher par ingrédient pour le barrer en magasin.
// La liste est ensuite MODIFIABLE à l'écran (adapter à ce qu'il y a
// déjà dans le frigo) : quantité éditable, retrait d'une ligne, ajout
// manuel d'un article (rayon "Autre" pour le non-alimentaire).
// L'addition initiale est faite par MySQL (voir server/index.js) ; les
// modifications, elles, sont locales à la page : régénérer la liste
// repart des recettes sélectionnées.

import { useEffect, useState } from 'react'
import { chargerMeta, genererListeCourses } from '../api'
import type { ListeParRayon, MetaCatalogue, ResumeRepas } from '../types'

interface ListeCoursesProps {
  resume: ResumeRepas[]
  onRetour: () => void
}

// Ordre de passage du magasin voulu par l'utilisateur. Les rayons
// renvoyés par l'API mais absents de cette liste (ou "Sans rayon")
// sont affichés en fin de liste. "Autre" est la zone des achats non
// alimentaires (papier toilette, éponge...) : en toute fin de liste.
const ORDRE_RAYONS = [
  'Protéines',
  'Féculents',
  'Fruits et légumes',
  'Produits laitiers',
  'Lipides',
  'Épicerie',
  'Condiments',
  'Autre',
]

export default function ListeCourses({ resume, onRetour }: ListeCoursesProps) {
  const [liste, setListe] = useState<ListeParRayon | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  // identifiants des lignes cochées ("rayon|ingrédient")
  const [cochees, setCochees] = useState<Set<string>>(new Set())

  // catalogue (rayons, unités) pour le formulaire d'ajout d'ingrédient
  const [meta, setMeta] = useState<MetaCatalogue | null>(null)
  const [nouveauNom, setNouveauNom] = useState('')
  const [nouvelleQuantite, setNouvelleQuantite] = useState('')
  const [nouvelleUnite, setNouvelleUnite] = useState('')
  const [nouveauRayon, setNouveauRayon] = useState('')
  const [erreurAjout, setErreurAjout] = useState<string | null>(null)

  useEffect(() => {
    chargerMeta()
      .then((m) => setMeta(m))
      .catch(() => setErreurAjout("Impossible de charger les listes (rayons, unités)."))
  }, [])

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

  // Les modifications ci-dessous sont locales à la liste affichée :
  // elles adaptent ce que montre l'écran, sans rien écrire en base.
  // Régénérer la liste repart des recettes sélectionnées.

  // saisie d'une nouvelle quantité pour une ligne (0 accepté le temps
  // de la frappe ; suppression explicite via le bouton × de la ligne)
  function changerQuantite(rayon: string, index: number, texte: string) {
    const valeur = Number(texte)
    setListe((precedent) => {
      if (precedent === null) return precedent
      const lignes = [...precedent[rayon]]
      lignes[index] = { ...lignes[index], total: Number.isNaN(valeur) || valeur < 0 ? 0 : valeur }
      return { ...precedent, [rayon]: lignes }
    })
  }

  function supprimerLigne(rayon: string, index: number) {
    setListe((precedent) => {
      if (precedent === null) return precedent
      const lignes = precedent[rayon].filter((_, i) => i !== index)
      const copie = { ...precedent }
      if (lignes.length === 0) delete copie[rayon]
      else copie[rayon] = lignes
      return copie
    })
  }

  function ajouterLigne() {
    if (liste === null) return
    const nom = nouveauNom.trim()
    const quantite = Number(nouvelleQuantite)
    if (nom === '') {
      setErreurAjout("Donne un nom à l'article.")
      return
    }
    if (nouvelleQuantite === '' || Number.isNaN(quantite) || quantite <= 0) {
      setErreurAjout('La quantité doit être un nombre supérieur à 0.')
      return
    }
    if (nouveauRayon === '') {
      setErreurAjout('Choisis un rayon.')
      return
    }
    setErreurAjout(null)
    setListe((precedent) => {
      const copie = { ...precedent }
      const lignes = [...(copie[nouveauRayon] ?? [])]
      // même article et même unité dans ce rayon : on additionne
      const existante = lignes.findIndex(
        (l) =>
          l.ingredient.toLowerCase() === nom.toLowerCase() &&
          (l.unite ?? '') === nouvelleUnite,
      )
      if (existante >= 0) {
        lignes[existante] = {
          ...lignes[existante],
          total: Number(lignes[existante].total) + quantite,
        }
      } else {
        lignes.push({
          ingredient: nom.charAt(0).toUpperCase() + nom.slice(1),
          unite: nouvelleUnite === '' ? null : nouvelleUnite,
          total: quantite,
        })
      }
      copie[nouveauRayon] = lignes
      return copie
    })
    setNouveauNom('')
    setNouvelleQuantite('')
    setNouvelleUnite('')
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
              {liste[rayon].map((ligne, index) => {
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
                    </label>
                    <span className="controle-quantite">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="saisie-quantite"
                        value={ligne.total}
                        onChange={(e) => changerQuantite(rayon, index, e.target.value)}
                        aria-label={`Quantité de ${ligne.ingredient}`}
                      />
                      <span className="unite">{ligne.unite ?? ''}</span>
                    </span>
                    <button
                      type="button"
                      className="btn-retirer-ligne"
                      onClick={() => supprimerLigne(rayon, index)}
                      aria-label={`Retirer ${ligne.ingredient} de la liste`}
                      title="Retirer de la liste"
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))
      )}

      <div className="ajout-ingredient">
        <h3>Ajouter un article</h3>
        {meta === null ? (
          <p>{erreurAjout ?? 'Chargement des listes…'}</p>
        ) : (
          <>
            <div className="champs-ajout">
              <label className="champ">
                Article
                <input
                  type="text"
                  value={nouveauNom}
                  onChange={(e) => setNouveauNom(e.target.value)}
                  placeholder="Papier toilette"
                />
              </label>
              <label className="champ champ-court">
                Quantité
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={nouvelleQuantite}
                  onChange={(e) => setNouvelleQuantite(e.target.value)}
                  placeholder="2"
                />
              </label>
              <label className="champ champ-court">
                Unité
                <select
                  value={nouvelleUnite}
                  onChange={(e) => setNouvelleUnite(e.target.value)}
                >
                  <option value="">—</option>
                  {meta.unites.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
              <label className="champ">
                Rayon
                <select value={nouveauRayon} onChange={(e) => setNouveauRayon(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {meta.rayons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {erreurAjout && <p className="message-erreur message-erreur-ajout">{erreurAjout}</p>}
            <button type="button" className="btn-ajouter-ligne" onClick={ajouterLigne}>
              + ajouter à la liste
            </button>
          </>
        )}
      </div>
    </section>
  )
}
