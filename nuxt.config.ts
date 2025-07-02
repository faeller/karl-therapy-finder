import pkg from './package.json';
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },
  modules: ['@nuxthub/core', '@pinia/nuxt', '@pinia/colada-nuxt', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  hub: {
    database: true,
  },
  colorMode: {
    preference: 'dark',
  },
  runtimeConfig: {
    public: {
      version: pkg.version,
    },
  },
});
