<template>
  <div>
    <PageCard>
      <div class="w-full max-w-4xl mx-auto text-white">
        <h1 class="text-3xl font-bold mb-8">Impressum & Allgemeine Geschäftsbedingungen</h1>
        
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

          <!-- Terms of Service Section -->
          <div class="mt-12 pt-8 border-t border-white/20">
            <h2 class="text-2xl font-bold mb-6 text-blue-200">Allgemeine Geschäftsbedingungen</h2>
            
            <div class="prose prose-invert max-w-none prose-headings:text-blue-200 prose-p:text-blue-100/90 prose-strong:text-blue-200 prose-a:text-blue-400 hover:prose-a:text-blue-300">
              <h3>1. Geltungsbereich</h3>
              <p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Website KARL (karl-helps.org) und der damit verbundenen Dienstleistungen. KARL ist ein kostenloser Service zur Unterstützung bei der Suche nach Therapieplätzen in Deutschland.</p>

              <h3>2. Leistungsbeschreibung</h3>
              <p>KARL bietet folgende Dienstleistungen:</p>
              <ul>
                <li><strong>Therapiesuche</strong>: Durchsuchbare Datenbank von Therapiepraxen in Deutschland</li>
                <li><strong>Kontaktmanagement</strong>: Tools zur Verwaltung von Kontaktversuchen zu Therapiepraxen</li>
                <li><strong>E-Mail-Integration</strong>: Optional verfügbare Gmail-Integration zum Versenden von E-Mails an Therapiepraxen</li>
                <li><strong>Datenmanagement</strong>: Import/Export-Funktionen für Benutzerdaten</li>
              </ul>

              <h3>3. Nutzungsbedingungen</h3>

              <h4>3.1 Bestimmungsgemäße Nutzung</h4>
              <p>Der Service dient ausschließlich der Suche nach Therapieplätzen für den persönlichen Bedarf. Eine kommerzielle Nutzung ist nicht gestattet.</p>

              <h4>3.2 Verbotene Aktivitäten</h4>
              <p>Folgende Aktivitäten sind untersagt:</p>
              <ul>
                <li>Automatisierte Abfragen oder Scraping der Website</li>
                <li>Übermäßige oder missbräuchliche Nutzung der E-Mail-Funktionen</li>
                <li>Versendung von Spam oder unerwünschten Nachrichten an Therapiepraxen</li>
                <li>Manipulation oder Störung der Website-Funktionalität</li>
              </ul>

              <h4>3.3 Gmail-Integration</h4>
              <ul>
                <li>Die Gmail-Integration ist optional und erfordert Ihre ausdrückliche Zustimmung</li>
                <li>Wir verwenden Ihre Google-Daten ausschließlich zum Versenden von E-Mails in Ihrem Namen</li>
                <li>Sie können die Berechtigung jederzeit in Ihren Google-Kontoeinstellungen widerrufen</li>
              </ul>

              <h3>4. Haftungsausschluss</h3>

              <h4>4.1 Richtigkeit der Daten</h4>
              <p>Wir bemühen uns, aktuelle und korrekte Informationen über Therapiepraxen bereitzustellen. Eine Gewähr für die Vollständigkeit, Richtigkeit oder Aktualität der Daten können wir jedoch nicht übernehmen.</p>

              <h4>4.2 Therapievermittlung</h4>
              <p>KARL ist lediglich ein Suchservice. Wir vermitteln keine Therapieplätze und übernehmen keine Verantwortung für die Qualität oder Verfügbarkeit der aufgelisteten Therapiepraxen.</p>

              <h4>4.3 Technische Verfügbarkeit</h4>
              <p>Eine ständige Verfügbarkeit der Website können wir nicht garantieren. Wartungsarbeiten und technische Störungen können zeitweise zu Ausfällen führen.</p>

              <h3>5. Datenschutz</h3>
              <p>Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung, die unter <NuxtLink to="/privacy" class="text-blue-400 hover:text-blue-300">/privacy</NuxtLink> einsehbar ist.</p>

              <h3>6. Änderungen der AGB</h3>
              <p>Wir behalten uns das Recht vor, diese AGB jederzeit zu ändern. Über wesentliche Änderungen werden wir Sie informieren.</p>

              <h3>7. Schlussbestimmungen</h3>

              <h4>7.1 Anwendbares Recht</h4>
              <p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.</p>

              <h4>7.2 Gerichtsstand</h4>
              <p>Gerichtsstand für alle Streitigkeiten ist Sankt Augustin, Deutschland.</p>

              <h4>7.3 Salvatorische Klausel</h4>
              <p>Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</p>
            </div>
          </div>

          <div class="mt-8 text-center">
            <div class="space-y-4">
              <div class="flex justify-center space-x-4">
                <NuxtLink to="/privacy" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
  title: 'Impressum & AGB - KARL',
  description: 'Impressum und Allgemeine Geschäftsbedingungen für KARL - Therapieplatz-Finder für Deutschland'
})
</script>