export const useLanguageStore = defineStore('language', {
  state: () => ({
    currentLocale: 'de' as string
  }),

  actions: {
    setLocale(locale: string) {
      this.currentLocale = locale
    }
  },

  persist: true
})