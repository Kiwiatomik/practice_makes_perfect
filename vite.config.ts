/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Suppress deprecation warnings from Bootstrap's internal usage
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
        quietDeps: true
      }
    }
  },
  build: {
    // Reduce chunk size warning threshold
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Better asset naming for cache busting
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name!.split('.')
          const ext = info.pop()
          const name = info.join('.')
          
          // Font files
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name!)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          
          // Images
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/.test(assetInfo.name!)) {
            return `assets/images/[name]-[hash][extname]`
          }
          
          // CSS files
          if (ext === 'css') {
            return `assets/css/[name]-[hash][extname]`
          }
          
          return `assets/[name]-[hash][extname]`
        },
        
        // JS chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            // Extract meaningful name from the file path
            const name = facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            if (name) {
              return `assets/js/${name}-[hash].js`
            }
          }
          return `assets/js/[name]-[hash].js`
        },
        
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor libraries
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'bootstrap-vendor': ['react-bootstrap', 'bootstrap'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
          'katex-vendor': ['katex', 'react-katex'],
          
          // Group pages by functionality
          'auth-pages': [
            './src/pages/Account.tsx',
            './src/components/LoginModal.tsx', 
            './src/components/RegisterModal.tsx'
          ],
          'course-pages': [
            './src/pages/CoursePage.tsx',
            './src/pages/BrowseCourses.tsx',
            './src/components/CourseCard.tsx'
          ],
          'lesson-pages': [
            './src/pages/Lesson.tsx',
            './src/components/QuestionModal.tsx',
            './src/components/LessonCard.tsx'
          ],
          'admin-pages': [
            './src/pages/CreateCourse.tsx',
            './src/pages/CreateLesson.tsx',
            './src/pages/Dashboard.tsx'
          ]
        }
      }
    },
    // Enable compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  }
})