// types.ts — la forme des données reçues de l'API.
// Un type sert de contrat : si l'API renvoie autre chose, TypeScript
// nous préviendra dès la compilation.

export interface Ingredient {
  id: number
  nom: string
  quantite: number
  id_categorie: number | null
  unite: string | null
}

export interface Outil {
  id: number
  nom: string
}

export interface Saison {
  id: number
  nom: string
}

export interface Recette {
  id: number
  nom: string
  temps_de_preparation: number | null
  consignes: string | null
  image_url: string | null
  prix: number | null
  saison: Saison | null
  vegetarien: boolean
  outils: Outil[]
  ingredients: Ingredient[]
}

// Une ligne du résumé de la semaine : "Chili con carne", pris 2 fois
export interface ResumeRepas {
  id: number
  nom: string
  quantite: number
}

// Une ligne de la liste de courses, telle que renvoyée par l'API
export interface LigneListe {
  ingredient: string
  unite: string | null
  total: number
}

// Réponse de POST /api/liste-courses : map rayon -> lignes
export type ListeParRayon = Record<string, LigneListe[]>

// Réponse de GET /api/meta : le catalogue des listes déroulantes
export interface MetaCatalogue {
  saisons: { id: number; nom: string }[]
  outils: { id: number; nom: string }[]
  rayons: string[]
  unites: string[]
}

// Corps envoyé à POST /api/recettes
export interface CreerRecettePayload {
  nom: string
  temps_de_preparation: number | null
  consignes?: string | null
  image_url?: string | null
  prix: number | null
  id_saison: number | null
  vegetarien: boolean
  outils: number[]
  ingredients: { nom: string; quantite: number; unite: string; rayon: string }[]
}
