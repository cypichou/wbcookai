// App.tsx — l'aiguillage entre les pages.
// La sélection de repas (map id -> quantité) et le résumé généré vivent
// ICI, dans App : c'est ce qui les fait survivre aux changements de page
// (sinon les composants seraient démontés et leur état perdu).

import { useEffect, useRef, useState } from 'react'
import './App.css'
import Accueil from './pages/Accueil'
import SelectionRecettes from './pages/SelectionRecettes'
import ListeCourses from './pages/ListeCourses'
import AjouterRecette from './pages/AjouterRecette'
import type { ResumeRepas } from './types'

type Page = 'accueil' | 'selection' | 'liste-courses' | 'ajouter-recette'
const PAGES: Page[] = ['accueil', 'selection', 'liste-courses', 'ajouter-recette']

function App() {
  // Au chargement, on reprend la page indiquée dans l'URL (#selection...)
  // si elle existe — un rafraîchissement ne renvoie donc pas à l'accueil.
  const [page, setPage] = useState<Page>(() => {
    const hash = window.location.hash.replace('#', '') as Page
    return PAGES.includes(hash) ? hash : 'accueil'
  })
  const [selection, setSelection] = useState<Record<number, number>>({})
  const [resume, setResume] = useState<ResumeRepas[]>([])

  function ajouterRepas(id: number) {
    setSelection((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }))
  }

  function retirerRepas(id: number) {
    setSelection((s) => {
      const qte = (s[id] ?? 0) - 1
      const copie = { ...s }
      if (qte <= 0) delete copie[id]
      else copie[id] = qte
      return copie
    })
  }

  // appelé par le bouton "Générer ma liste de courses" :
  // on mémorise le résumé des repas puis on change de page
  function ouvrirListe(nouveauResume: ResumeRepas[]) {
    setResume(nouveauResume)
    setPage('liste-courses')
  }

  // Chaque page visitée est enregistrée dans l'historique du navigateur :
  // le bouton "précédent" (et le geste swipe arrière sur téléphone)
  // revient à la page d'avant, comme sur un site classique.
  const premierePage = useRef(true)
  useEffect(() => {
    if (premierePage.current) {
      premierePage.current = false
      window.history.replaceState({ page }, '', `#${page}`)
    } else {
      window.history.pushState({ page }, '', `#${page}`)
    }
  }, [page])

  // Le navigateur recule d'une entrée d'historique : on affiche cette page.
  useEffect(() => {
    function surPrecedent(e: PopStateEvent) {
      const cible = (e.state?.page ?? window.location.hash.replace('#', '')) as Page
      setPage(PAGES.includes(cible) ? cible : 'accueil')
    }
    window.addEventListener('popstate', surPrecedent)
    return () => window.removeEventListener('popstate', surPrecedent)
  }, [])

  if (page === 'accueil') {
    return <Accueil onCommencer={() => setPage('selection')} />
  }

  if (page === 'liste-courses') {
    return <ListeCourses resume={resume} onRetour={() => setPage('selection')} />
  }

  if (page === 'ajouter-recette') {
    return <AjouterRecette onRetour={() => setPage('selection')} onCree={() => setPage('selection')} />
  }

  return (
    <SelectionRecettes
      selection={selection}
      onAjouter={ajouterRepas}
      onRetirer={retirerRepas}
      onRetour={() => setPage('accueil')}
      onGenerer={ouvrirListe}
      onAjouterRecette={() => setPage('ajouter-recette')}
    />
  )
}

export default App
