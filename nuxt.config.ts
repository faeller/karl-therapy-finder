import { defineNuxtConfig } from 'nuxt/config';
import pkg from './package.json';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },
  modules: ['@nuxthub/core', '@pinia/nuxt', '@pinia/colada-nuxt', '@nuxt/ui', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'KARL - Therapieplatz-Finder für Deutschland',
      meta: [
        { name: 'description', content: 'KARL hilft dir dabei, einen Therapieplatz in Deutschland zu finden - mit einem geleiteten Prozess und Therapeutensuche.' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },
  hub: {
    database: true,
  },
  colorMode: {
    preference: 'dark',
  },
  i18n: {
    locales: ['de', 'en'],
    defaultLocale: 'de',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    },
    vueI18n: './i18n.config.ts'
  },
  runtimeConfig: {
    public: {
      version: pkg.version,
    },
  },
  nitro: {
    experimental: {
      wasm: true
    }
  },
});
