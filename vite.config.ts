import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages はリポジトリ名の下の階層で配信されるため、相対パスで組み立てる
export default defineConfig({
  base: './',
  plugins: [react()],
})
