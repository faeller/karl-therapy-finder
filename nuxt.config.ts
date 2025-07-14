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
      htmlAttrs: {
        lang: 'de-DE'
      },
      meta: [
        { name: 'description', content: 'KARL hilft dir dabei, einen Therapieplatz in Deutschland zu finden - mit einem geleiteten Prozess und Therapeutensuche.' },
        { 'http-equiv': 'Content-Language', content: 'de-DE' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ],
      script: [
        {
          defer: true,
          'data-domain': 'karl-helps.org',
          src: 'https://plausible.io/js/script.hash.js'
        },
        {
          innerHTML: 'window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }'
        }
      ]
    }
  },
  hub: {
    kv: true
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
    // Private keys (server-side only)
    gmailClientSecret: process.env.GMAIL_CLIENT_SECRET,
    patreonClientSecret: process.env.PATREON_CLIENT_SECRET,
    patreonAllowedRedirectUris: process.env.PATREON_ALLOWED_REDIRECT_URIS,
    karlAdminPatreonEmail: process.env.KARL_ADMIN_PATREON_EMAIL,
    
    // Public keys (client-side accessible)
    public: {
      version: pkg.version,
      gmailClientId: process.env.GMAIL_CLIENT_ID,
      patreonClientId: process.env.PATREON_CLIENT_ID,
      patreonAllowedRedirectUris: process.env.PATREON_ALLOWED_REDIRECT_URIS,
      privacyPolicyEnabled: process.env.NUXT_PUBLIC_PRIVACY_POLICY_ENABLED,
    },
  },
  nitro: {
    experimental: {
      wasm: true
    }
  },
});
