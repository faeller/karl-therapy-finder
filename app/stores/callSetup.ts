import { defineStore } from 'pinia'

export interface CallSetupFormData {
  patient_name: string
  patient_dob: string
  patient_insurance: string
  patient_phone: string
  patient_address: string
  patient_postal_code: string
  patient_city: string
  consent_given: boolean
  call_timing: 'now' | 'scheduled' | null
  scheduled_date: string
  scheduled_time: string
  voice_recording_base64: string | null
  voice_recording_filename: string | null
  voice_recording_type: string | null
}

export const useCallSetupStore = defineStore('callSetup', {
  state: () => ({
    formData: {
      patient_name: '',
      patient_dob: '',
      patient_insurance: '',
      patient_phone: '',
      patient_address: '',
      patient_postal_code: '',
      patient_city: '',
      consent_given: false,
      call_timing: null,
      scheduled_date: '',
      scheduled_time: '',
      voice_recording_base64: null,
      voice_recording_filename: null,
      voice_recording_type: null
    } as CallSetupFormData,
    currentStep: 0,
    isCompleted: false
  }),

  actions: {
    updateFormData(data: Partial<CallSetupFormData>) {
      Object.assign(this.formData, data)
    },

    setCurrentStep(step: number) {
      this.currentStep = step
    },

    clearForm() {
      this.formData = {
        patient_name: '',
        patient_dob: '',
        patient_insurance: '',
        patient_phone: '',
        patient_address: '',
        patient_postal_code: '',
        patient_city: '',
        consent_given: false,
        call_timing: null,
        scheduled_date: '',
        scheduled_time: '',
        voice_recording_base64: null,
        voice_recording_filename: null,
        voice_recording_type: null
      }
      this.currentStep = 0
      this.isCompleted = false
    },

    completeSetup() {
      this.isCompleted = true
    },

    async saveVoiceRecording(audioBlob: Blob, filename: string = 'consent.wav') {
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          // Remove data URL prefix to get pure base64
          resolve(result.split(',')[1])
        }
        reader.readAsDataURL(audioBlob)
      })

      this.formData.voice_recording_base64 = base64
      this.formData.voice_recording_filename = filename
      this.formData.voice_recording_type = audioBlob.type || 'audio/wav'
    },

    getVoiceRecordingBlob(): Blob | null {
      if (!this.formData.voice_recording_base64) {
        return null
      }

      try {
        // Convert base64 back to blob
        const byteCharacters = atob(this.formData.voice_recording_base64)
        const byteNumbers = new Array(byteCharacters.length)
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        
        const byteArray = new Uint8Array(byteNumbers)
        return new Blob([byteArray], { type: this.formData.voice_recording_type || 'audio/wav' })
      } catch (error) {
        console.error('Error converting base64 to blob:', error)
        return null
      }
    },

    clearVoiceRecording() {
      this.formData.voice_recording_base64 = null
      this.formData.voice_recording_filename = null
      this.formData.voice_recording_type = null
    },

    hasVoiceRecording(): boolean {
      return !!this.formData.voice_recording_base64
    }
  },

  persist: process.client // Persists state to localStorage on client side
})