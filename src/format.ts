// format.ts — mise en forme des quantités, partagée entre les pages.
// Centraliser les cas de figure ici évite que chaque page réinvente
// l'affichage d'un couple (nombre, unité) :
//   - pas d'unité → juste le nombre ("2")
//   - décimal → virgule française ("1,5 g")
//   - "pièce" au pluriel → "2 pièces" au singulier "1 pièce"

export function formaterQuantite(total: number | string, unite: string | null): string {
  const nombre = Number(total)
  const texte = Number.isInteger(nombre)
    ? String(nombre)
    : String(nombre).replace('.', ',')
  if (!unite) return texte
  if (unite === 'pièce' && nombre > 1) return `${texte} pièces`
  return `${texte} ${unite}`
}
