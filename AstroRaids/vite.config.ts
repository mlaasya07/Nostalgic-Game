import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/AstroRaids/',   // 👈 this is the folder it will live in
  plugins: [react()],
})
