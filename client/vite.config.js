import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
// import mkcert from "vite-plugin-mkcert"; // No longer needed

// https://vitejs.dev/config/
export default defineConfig({
  server: { https: false }, // <-- CHANGE THIS TO FALSE
  plugins: [
    react(),
    // mkcert() // You can remove this
  ],
})