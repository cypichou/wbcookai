import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages sert le site sous https://cypichou.github.io/wbcookai/,
  // pas à la racine d'un domaine : tous les chemins d'assets produits par
  // le build doivent donc être préfixés par /wbcookai/.
  base: '/wbcookai/',
})
