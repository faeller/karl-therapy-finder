<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'en' },
  link: [
    { rel: 'icon', href: '/icon.png' },
    { rel: 'apple-touch-icon', href: '/icon.png' },
    { rel: 'msapplication-TileImage', href: '/icon.png' },
  ],
});

useSeoMeta({
  title: 'KARL - Kontakt Automatisierung Richtung Leben',
  description: 'Dein KI-Buddy für die Therapieplatz-Jagd in Deutschland. KARL hilft dir dabei, einen Therapieplatz zu finden und den bürokratischen Prozess zu navigieren.',
  ogTitle: 'KARL - Kontakt Automatisierung Richtung Leben',
  ogDescription: 'Dein KI-Buddy für die Therapieplatz-Jagd in Deutschland. KARL hilft dir dabei, einen Therapieplatz zu finden und den bürokratischen Prozess zu navigieren.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  twitterCard: 'summary_large_image',
  ogImage: '/social-card.png',
  twitterImage: '/social-card.png',
  ogType: 'website',
  ogUrl: 'https://karl.app',
  ogSiteName: 'KARL',
  robots: 'index, follow',
  keywords: 'therapie, therapieplatz, psychotherapie, deutschland, krankenkasse, kostenerstattung, karl, therapiefinder',
});
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
