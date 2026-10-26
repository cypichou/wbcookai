// AjouterRecette.tsx — le formulaire de création d'une recette.
//
// On garde TOUT le formulaire dans un seul useState par champ (nom, prix,
// saison...) et les lignes d'ingrédients dans un tableau. À la validation,
// on traduit ce formulaire en payload JSON pour POST /api/recettes :
//   - le prix €/€€/€€€ devient un montant (2, 4, 6) : la jauge et le
//     filtre de la page de sélection travaillent sur des nombres,
//   - chaque ligne d'ingrédient part avec son duo (rayon, unite),
//     que l'API traduit en catégorie.
// Après le succès, App ramène à la page de sélection, qui se recharge
// toute seule (nouvelle requête GET) et affiche la nouvelle recette.

import { useEffect, useState } from 'react'
import { chargerMeta, creerRecette } from '../api'
import type { MetaCatalogue } from '../types'

interface AjouterRecetteProps {
  onRetour: () => void // abandon
  onCree: () => void // succès : retour à la sélection
}

interface LigneIngredient {
  nom: string
  quantite: string
  unite: string
  rayon: string
}

// montant enregistré pour chaque niveau de la jauge € (cf. symbolePrix)
const PRIX_PAR_NIVEAU: Record<string, number> = { '€': 2, '€€': 4, '€€€': 6 }

export default function AjouterRecette({ onRetour, onCree }: AjouterRecetteProps) {
  const [meta, setMeta] = useState<MetaCatalogue | null>(null)
  const [erreurChargement, setErreurChargement] = useState<string | null>(null)

  const [nom, setNom] = useState('')
  const [idSaison, setIdSaison] = useState('')
  const [temps, setTemps] = useState('')
  const [vegetarien, setVegetarien] = useState(false)
  const [niveauPrix, setNiveauPrix] = useState('')
  const [outilsChoisis, setOutilsChoisis] = useState<Set<number>>(new Set())

  const [lignes, setLignes] = useState<LigneIngredient[]>([{ nom: '', quantite: '', unite: '', rayon: '' }])

  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    let annule = false
    chargerMeta()
      .then((m) => {
        if (!annule) setMeta(m)
      })
      .catch(() => {
        if (!annule) setErreurChargement("Impossible de charger les listes (saisons, rayons...). Vérifie l'API.")
      })
    return () => {
      annule = true
    }
  }, [])

  function modifierLigne(index: number, champ: keyof LigneIngredient, valeur: string) {
    setLignes((precedent) =>
      precedent.map((l, i) => (i === index ? { ...l, [champ]: valeur } : l)),
    )
  }

  function ajouterLigne() {
    setLignes((precedent) => [...precedent, { nom: '', quantite: '', unite: '', rayon: '' }])
  }

  function supprimerLigne(index: number) {
    setLignes((precedent) => precedent.filter((_, i) => i !== index))
  }

  function basculerOutil(id: number) {
    setOutilsChoisis((precedent) => {
      const copie = new Set(precedent)
      if (copie.has(id)) copie.delete(id)
      else copie.add(id)
      return copie
    })
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)

    // validation locale, avant d'envoyer quoi que ce soit
    const ingredientsValides = lignes.filter(
      (l) => l.nom.trim() !== '' && l.quantite !== '' && l.unite !== '' && l.rayon !== '',
    )
    if (nom.trim() === '') {
      setErreur('Le nom de la recette est obligatoire.')
      return
    }
    if (idSaison === '') {
      setErreur('Choisis une saison.')
      return
    }
    if (lignes.length === 0 || ingredientsValides.length === 0) {
      setErreur('Ajoute au moins un ingrédient complet (nom, quantité, unité, rayon).')
      return
    }

    setEnvoiEnCours(true)
    try {
      await creerRecette({
        nom: nom.trim(),
        temps_de_preparation: temps === '' ? null : Number(temps),
        prix: niveauPrix === '' ? null : PRIX_PAR_NIVEAU[niveauPrix],
        id_saison: Number(idSaison),
        vegetarien,
        outils: [...outilsChoisis],
        ingredients: ingredientsValides.map((l) => ({
          nom: l.nom.trim(),
          quantite: Number(l.quantite),
          unite: l.unite,
          rayon: l.rayon,
        })),
      })
      onCree() // succès : App ramène à la sélection, qui se recharge
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      setEnvoiEnCours(false)
    }
  }

  if (erreurChargement) {
    return (
      <section className="page-formulaire">
        <p className="message-erreur">{erreurChargement}</p>
        <button type="button" className="btn-primary" onClick={onRetour}>
          Retour
        </button>
      </section>
    )
  }

  if (meta === null) {
    return (
      <section className="page-formulaire">
        <p>Chargement du formulaire…</p>
      </section>
    )
  }

  return (
    <section className="page-formulaire">
      <header className="entete-liste">
        <button type="button" className="btn-retour" onClick={onRetour}>
          Retour aux recettes
        </button>
        <h2>Ajouter une recette</h2>
      </header>

      <form className="formulaire" onSubmit={soumettre}>
        <label className="champ champ-large">
          Nom de la recette
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Chili con carne"
            required
          />
        </label>

        <label className="champ">
          Saison
          <select value={idSaison} onChange={(e) => setIdSaison(e.target.value)} required>
            <option value="">— Choisir —</option>
            {meta.saisons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
        </label>

        <label className="champ">
          Temps de préparation (min)
          <input
            type="number"
            min="0"
            value={temps}
            onChange={(e) => setTemps(e.target.value)}
            placeholder="30"
          />
        </label>

        <label className="champ champ-coche">
          <input
            type="checkbox"
            checked={vegetarien}
            onChange={(e) => setVegetarien(e.target.checked)}
          />
          Végétarien
        </label>

        <fieldset className="champ">
          <legend>Prix</legend>
          <div className="choix-prix">
            {['€', '€€', '€€€'].map((niveau) => (
              <label key={niveau} className={niveauPrix === niveau ? 'prix-choisi' : ''}>
                <input
                  type="radio"
                  name="prix"
                  value={niveau}
                  checked={niveauPrix === niveau}
                  onChange={() => setNiveauPrix(niveau)}
                />
                {niveau}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="champ champ-large">
          <legend>Équipements nécessaires</legend>
          <div className="choix-outils">
            {meta.outils.map((o) => (
              <label key={o.id}>
                <input
                  type="checkbox"
                  checked={outilsChoisis.has(o.id)}
                  onChange={() => basculerOutil(o.id)}
                />
                {o.nom}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="champ champ-large">
          <legend>Ingrédients</legend>
          {lignes.map((ligne, index) => (
            <div key={index} className="ligne-ingredient">
              <label className="champ">
                Nom
                <input
                  type="text"
                  value={ligne.nom}
                  onChange={(e) => modifierLigne(index, 'nom', e.target.value)}
                  placeholder="Oignon"
                />
              </label>
              <label className="champ champ-court">
                Quantité
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={ligne.quantite}
                  onChange={(e) => modifierLigne(index, 'quantite', e.target.value)}
                  placeholder="2"
                />
              </label>
              <label className="champ champ-court">
                Unité
                <select value={ligne.unite} onChange={(e) => modifierLigne(index, 'unite', e.target.value)}>
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
                <select value={ligne.rayon} onChange={(e) => modifierLigne(index, 'rayon', e.target.value)}>
                  <option value="">—</option>
                  {meta.rayons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn-supprimer-ligne"
                onClick={() => supprimerLigne(index)}
                title="Supprimer cette ligne"
              >
                Supprimer
              </button>
            </div>
          ))}
          <button type="button" className="btn-ajouter-ligne" onClick={ajouterLigne}>
            + ingrédient
          </button>
        </fieldset>

        {erreur && <p className="message-erreur">{erreur}</p>}

        <div className="actions-formulaire">
          <button type="button" className="btn-retour" onClick={onRetour}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={envoiEnCours}>
            {envoiEnCours ? 'Enregistrement…' : 'Enregistrer la recette'}
          </button>
        </div>
      </form>
    </section>
  )
}
