// api.ts — le seul endroit du site qui parle à l'API.
// Centraliser les appels ici : si l'adresse de l'API change,
// il n'y a qu'un fichier à modifier.

import type { CreerRecettePayload, ListeParRayon, MetaCatalogue, Recette } from './types'

// En production (GitHub Pages), l'adresse de l'API Render est injectée à la
// construction via la variable d'environnement VITE_API_URL. En local,
// `npm run dev` n'a pas besoin de la définir : on retombe sur l'API locale.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// petit utilitaire interne : fetch + vérification du statut HTTP
async function verifier(reponse: Response): Promise<Response> {
  if (!reponse.ok) {
    throw new Error(`L'API a répondu avec le statut ${reponse.status}`)
  }
  return reponse
}

export async function chargerRecettes(): Promise<Recette[]> {
  const reponse = await verifier(await fetch(`${API_URL}/api/recettes`))
  return reponse.json()
}

// Le catalogue des listes déroulantes (saisons, outils, rayons, unités)
export async function chargerMeta(): Promise<MetaCatalogue> {
  const reponse = await verifier(await fetch(`${API_URL}/api/meta`))
  return reponse.json()
}

// Envoie la sélection (id + nombre de fois) et reçoit les ingrédients
// additionnés, regroupés par rayon. C'est l'API qui fait l'addition.
export async function genererListeCourses(recettes: { id: number; quantite: number }[]): Promise<ListeParRayon> {
  const reponse = await verifier(
    await fetch(`${API_URL}/api/liste-courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recettes }),
    }),
  )
  return reponse.json()
}

// Crée une recette (formulaire) : l'API répond { id, nom, message }
export async function creerRecette(payload: CreerRecettePayload): Promise<{ id: number }> {
  const reponse = await fetch(`${API_URL}/api/recettes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!reponse.ok) {
    // l'API renvoie { erreur: "..." } pour les saisies invalides
    const corps = await reponse.json().catch(() => null)
    throw new Error(corps?.erreur ?? `L'API a répondu avec le statut ${reponse.status}`)
  }
  return reponse.json()
}
