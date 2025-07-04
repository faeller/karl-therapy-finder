export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      common: {
        loading: "Lade...",
        continue: "Weiter",
        back: "Zurück",
        done: "Erledigt",
        close: "Schließen",
        save: "Speichern",
        cancel: "Abbrechen",
        yes: "Ja",
        no: "Nein",
        or: "oder",
        and: "und",
        free: "Kostenlos",
        completed: "Abgeschlossen ✓",
        markCompleted: "Als erledigt markieren",
        step: "Schritt",
        of: "von",
        progress: "Fortschritt"
      },
      nav: {
        home: "Startseite",
        app: "Home", 
        therapists: "Therapeuten",
        github: "GitHub"
      },
      landing: {
        title: "KARL",
        subtitle: "Kontakt Automatisierung Richtung Leben",
        subtitleNote: "(Ja, der Name ist genau so sperrig wie das deutsche Gesundheitssystem 🤷‍♂️)",
        hero: {
          buddy: "Dein Buddy für die",
          hunt: "Therapieplatz-Jagd",
          location: "in Deutschland"
        },
        cta: {
          start: "Los geht's, KARL!",
          github: "GitHub"
        }
      }
    },
    en: {
      common: {
        loading: "Loading...",
        continue: "Continue",
        back: "Back",
        done: "Done",
        close: "Close",
        save: "Save",
        cancel: "Cancel",
        yes: "Yes",
        no: "No",
        or: "or",
        and: "and",
        free: "Free",
        completed: "Completed ✓",
        markCompleted: "Mark as completed",
        step: "Step",
        of: "of",
        progress: "Progress"
      },
      nav: {
        home: "Home",
        app: "Guide",
        therapists: "Therapists", 
        github: "GitHub"
      },
      landing: {
        title: "KARL",
        subtitle: "Contact Automation Towards Life",
        subtitleNote: "(Yes, the name is as bureaucratic as the German healthcare system 🤷‍♂️)",
        hero: {
          buddy: "Your buddy for the",
          hunt: "Therapy Hunt",
          location: "in Germany"
        },
        cta: {
          start: "Let's go, KARL!",
          github: "GitHub"
        }
      }
    }
  }
}))