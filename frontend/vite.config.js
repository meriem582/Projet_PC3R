import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/search': 'https://meryouzik-backend.onrender.com',
      '/charts': 'https://meryouzik-backend.onrender.com', 
      '/tracks': 'https://meryouzik-backend.onrender.com',
      '/like': 'https://meryouzik-backend.onrender.com',
      '/unlike': 'https://meryouzik-backend.onrender.com',
      '/likes': 'https://meryouzik-backend.onrender.com',
      '/comment': 'https://meryouzik-backend.onrender.com',
      '/comments': 'https://meryouzik-backend.onrender.com',
      '/comment/delete': 'https://meryouzik-backend.onrender.com',
      '/comment/update': 'https://meryouzik-backend.onrender.com',
      "/response/add": 'https://meryouzik-backend.onrender.com',
      "/response/delete": 'https://meryouzik-backend.onrender.com',
      "/response/get": 'https://meryouzik-backend.onrender.com',
      "/response/count": 'https://meryouzik-backend.onrender.com',
      "/response/update": 'https://meryouzik-backend.onrender.com',
      "/register": 'https://meryouzik-backend.onrender.com',
      "/login0": 'https://meryouzik-backend.onrender.com',
      "/api/me": 'https://meryouzik-backend.onrender.com',
      "/confirm-email": 'https://meryouzik-backend.onrender.com',
    }
  }
})