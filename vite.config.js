import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/dnd_combat_tracker/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
