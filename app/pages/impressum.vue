<template>
  <div>
    <PageCard>
      <div class="w-full max-w-4xl mx-auto text-white">
        <h1 class="text-3xl font-bold mb-8">Impressum</h1>
        
        <div class="prose prose-invert max-w-none prose-headings:text-blue-200 prose-p:text-blue-100/90 prose-strong:text-blue-200 prose-a:text-blue-400 hover:prose-a:text-blue-300">
          <div class="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg mb-8">
            <h2 class="text-xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
            
            <div class="space-y-2">
              <p><strong>{{ runtimeConfig.public.companyName || 'KARL - Kontakt Automatisierung Richtung Leben - Merle Fäller' }}</strong></p>
              <p>{{ runtimeConfig.public.companyAddress || 'c/o Online-Impressum.de #32385' }}<br>
              {{ runtimeConfig.public.companyStreet || 'Europaring 90' }}<br>
              {{ runtimeConfig.public.companyCity || '53757 Sankt Augustin' }}</p>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <h3 class="text-lg font-semibold mb-3">Kontakt</h3>
              <div class="space-y-2">
                <p><strong>E-Mail:</strong> <a :href="`mailto:${runtimeConfig.public.companyEmail || 'karl@mein.online-impressum.de'}`" class="text-blue-400 hover:text-blue-300 hover:underline">{{ runtimeConfig.public.companyEmail || 'karl@mein.online-impressum.de' }}</a></p>
                <p><a href="https://www.mein.online-impressum.de/karl/#Zweiter_Kontaktweg" target="_blank" class="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/30 transition-colors">
                  Zweiter Kontaktweg
                  <Icon name="heroicons:arrow-top-right-on-square" class="w-4 h-4" />
                </a></p>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-semibold mb-3">Aufsichtsbehörde</h3>
              <div class="space-y-2">
                <p><strong>Zuständige Regulierungs- und Aufsichtsbehörde:</strong></p>
                <p>{{ runtimeConfig.public.regulatoryAuthority || 'Bayerische Landeszentrale für neue Medien' }}<br>
                <strong>Sitz:</strong> {{ runtimeConfig.public.regulatoryLocation || 'Deutschland' }}</p>
              </div>
            </div>
          </div>

          <div class="mt-8 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
            <h3 class="text-lg font-semibold mb-2">Geltungsbereich</h3>
            <p class="text-sm">Das hier angegebene Impressum gilt für alle Belange der Impressumspflicht nach §5 DDG, § 55 Abs.2 RStV & MStV §18 sowie für alle Social Media Auftritte des Creators. Erstellte Seiten können vom Creator bearbeitet werden; wir garantieren daher keine Vollständigkeit.</p>
          </div>

          <div class="mt-8">
            <h3 class="text-lg font-semibold mb-3">Rechtliche Hinweise</h3>
            
            <h4 class="font-semibold mt-4 mb-2">Haftung für Inhalte</h4>
            <p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
            
            <p>Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.</p>

            <h4 class="font-semibold mt-4 mb-2">Haftung für Links</h4>
            <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.</p>
            
            <p>Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.</p>

            <h4 class="font-semibold mt-4 mb-2">Urheberrecht</h4>
            <p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.</p>
            
            <p>Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.</p>
          </div>

          <div class="mt-8 text-center">
            <div class="space-y-4">
              <div class="flex justify-center space-x-4">
                <NuxtLink to="/privacy-policy" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Icon name="heroicons:shield-check" class="w-5 h-5 mr-2" />
                  Datenschutzerklärung
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageCard>
  </div>
</template>

<script setup>
const runtimeConfig = useRuntimeConfig()

useSeoMeta({
  title: 'Impressum - KARL',
  description: 'Impressum für KARL - Therapieplatz-Finder für Deutschland'
})
</script>