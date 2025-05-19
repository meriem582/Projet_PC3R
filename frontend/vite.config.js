import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

dotenv.config()

const API_URL = import.meta.env.VITE_API_URL

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/search': API_URL,
      '/charts': API_URL, 
      '/tracks': API_URL,
      '/like': API_URL,
      '/unlike': API_URL,
      '/likes': API_URL,
      '/comment': API_URL,
      '/comments': API_URL,
      '/comment/delete': API_URL,
      '/comment/update': API_URL,
      '/response/add': API_URL,
      '/response/delete': API_URL,
      '/response/get': API_URL,
      '/response/count': API_URL,
      '/response/update': API_URL,
      '/register': API_URL,
      '/login0': API_URL,
      '/api/me': API_URL,
      '/confirm-email': API_URL,
    }
  }
})
