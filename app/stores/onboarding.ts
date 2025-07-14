export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    formData: {
      nickname: '',
      skipNickname: false,
      isAdult: null as boolean | null,
      location: '',
      searchRadius: 25,
      struggles: [] as string[],
      therapistGender: 'egal',
      therapyMethods: [] as string[],
      paymentType: 'egal',
      hadRecentTherapy: null as boolean | null
    },
    currentStep: 0,
    isCompleted: false
  }),

  actions: {
    updateFormData(data: Partial<typeof this.formData>) {
      Object.assign(this.formData, data)
    },

    setCurrentStep(step: number) {
      this.currentStep = step
    },

    completeOnboarding() {
      this.isCompleted = true
    },

    resetOnboarding() {
      this.formData = {
        nickname: '',
        skipNickname: false,
        isAdult: null,
        location: '',
        searchRadius: 25,
        struggles: [],
        therapistGender: 'egal',
        therapyMethods: [] as string[],
        paymentType: 'egal',
        hadRecentTherapy: null
      }
      this.currentStep = 0
      this.isCompleted = false
    }
  },

  persist: process.client
})