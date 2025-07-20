import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss()
  ],
  server: {
    proxy: {
      // Proxy requests starting with /influx to the backend
      '/influx': {
        target: 'http://localhost:3000', // Your backend server
        changeOrigin: true, // Changes the origin of the request to match the target
        rewrite: (path) => path.replace(/^\/influx/, '/influx') // Ensure the path is preserved
      }
    }
  }
})