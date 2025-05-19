import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/search': import.meta.env.VITE_API_URL,
      '/charts': import.meta.env.VITE_API_URL, 
      '/tracks': import.meta.env.VITE_API_URL,
      '/like': import.meta.env.VITE_API_URL,
      '/unlike': import.meta.env.VITE_API_URL,
      '/likes': import.meta.env.VITE_API_URL,
      '/comment': import.meta.env.VITE_API_URL,
      '/comments': import.meta.env.VITE_API_URL,
      '/comment/delete': import.meta.env.VITE_API_URL,
      '/comment/update': import.meta.env.VITE_API_URL,
      "/response/add": import.meta.env.VITE_API_URL,
      "/response/delete": import.meta.env.VITE_API_URL,
      "/response/get": import.meta.env.VITE_API_URL,
      "/response/count": import.meta.env.VITE_API_URL,
      "/response/update": import.meta.env.VITE_API_URL,
      "/register": import.meta.env.VITE_API_URL,
      "/login0": import.meta.env.VITE_API_URL,
      "/api/me": import.meta.env.VITE_API_URL,
      "/confirm-email": import.meta.env.VITE_API_URL,
    }
  }
})