// Accueil.tsx — la page de bienvenue (code déplacé de App.tsx,
// l'animation du titre au survol de la souris est conservée telle quelle).

import { useEffect, useRef } from 'react'

interface AccueilProps {
  onCommencer: () => void
}

export default function Accueil({ onCommencer }: AccueilProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  // pour faire bouger le titre
  useEffect(() => {
    const title = titleRef.current
    if (!title) return

    const onMove = (e: MouseEvent) => {
      const rect = title.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / window.innerWidth
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy)
      const lift = Math.min(dist / 500, 1)

      const ox = dx * 80
      const oy = 8 + lift * 26
      const blur = 10 + lift * 34
      const alpha = 0.45 - lift * 0.15

      title.style.textShadow = `${ox.toFixed(1)}px ${oy.toFixed(1)}px ${blur.toFixed(1)}px rgba(0, 0, 0, ${alpha.toFixed(2)})`
      title.style.transform = `translate(${(-dx * 14).toFixed(1)}px, ${(-lift * 8).toFixed(1)}px)`
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <section id="home">
      <h1 ref={titleRef}>Bienvenue mon gourmand</h1>
      <p>Créez un compte ou connectez-vous pour continuer.</p>
      <div className="auth-actions">
        <button type="button" className="btn-primary" onClick={onCommencer}>
          Commencer
        </button>
      </div>
    </section>
  )
}
