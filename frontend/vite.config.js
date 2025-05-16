import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/search': 'http://localhost:8080',
      '/charts': 'http://localhost:8080', 
      '/tracks': 'http://localhost:8080',
      '/like': 'http://localhost:8080',
      '/unlike': 'http://localhost:8080',
      '/likes': 'http://localhost:8080',
      '/comment': 'http://localhost:8080',
      '/comments': 'http://localhost:8080',
      '/comment/delete': 'http://localhost:8080',
      '/comment/update': 'http://localhost:8080',
      "/response/add": 'http://localhost:8080',
      "/response/delete": 'http://localhost:8080',
      "/response/get": 'http://localhost:8080',
      "/response/count": 'http://localhost:8080',
      "/response/update": 'http://localhost:8080',
      "/register": 'http://localhost:8080',
      "/login0": 'http://localhost:8080',
    }
  }
})