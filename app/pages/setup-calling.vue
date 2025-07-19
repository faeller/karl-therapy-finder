<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6">
      <!-- Loading Animation -->
      <div v-if="isLoading">
        <LoadingSpinner 
          container-class="py-12"
        />
      </div>

      <!-- Main Content -->
      <div v-else>
        <!-- Header -->
        <div class="text-center space-y-2 mb-6">
          <div class="flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-blue-500/30 bg-linear-to-br from-blue-400/80 to-blue-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm mx-auto">
            📞
          </div>
          <h1 class="text-2xl font-bold text-white">KARL Anrufdienst einrichten 🔧</h1>
          <p class="text-blue-100/80 text-sm">Alle Angaben sind erforderlich für den automatischen Anruf</p>
        </div>

        <!-- Stepper -->
        <UStepper 
          ref="stepper"
          :model-value="currentStep"
          @update:model-value="(value) => setCurrentStep(value)"
          :items="setupSteps" 
          color="primary"
          size="sm"
          class="w-full max-w-4xl mx-auto"
          orientation="horizontal"
        >
        <!-- Step 1: Patient Information -->
        <template #patient-info>
          <div class="space-y-6 text-center" lang="de-DE">
            <div class="space-y-2">
              <h2 class="text-xl font-semibold text-white">Patienteninformationen</h2>
              <p class="text-blue-100/80 text-sm">Gib die Daten für den Anruf bei der 116117 ein</p>
            </div>
            
            <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-lg mx-auto" lang="de-DE">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-blue-100/80 mb-2">Vollständiger Name</label>
                  <input
                    v-model="formData.patient_name"
                    placeholder="z.B. Max Mustermann"
                    class="w-full px-4 py-4 text-lg bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-blue-100/80 mb-2">
                    Geburtsdatum
                  </label>
                  <VueDatePicker
                    v-model="birthDate"
                    :locale="'de'"
                    :format="'dd.MM.yyyy'"
                    :enable-time-picker="false"
                    :max-date="new Date()"
                    :year-range="[1900, new Date().getFullYear()]"
                    placeholder="TT.MM.JJJJ"
                    dark
                    text-input
                    :text-input-options="{
                      format: 'dd.MM.yyyy',
                      selectOnFocus: true,
                      openOnFocus: false
                    }"
                    :format-locale="deLocale"
                    ref="birthDatePicker"
                    input-class-name="custom-datepicker-input"
                    :input-icon="false"
                    :class="[
                      'w-full',
                      birthDateError ? 'dp-error' : ''
                    ]"
                  />
                  <p v-if="birthDateError" class="text-red-400 text-xs mt-1">{{ birthDateError }}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-blue-100/80 mb-2">Krankenversicherung</label>
                  <input
                    v-model="formData.patient_insurance"
                    placeholder="z.B. AOK Bayern"
                    class="w-full px-4 py-4 text-lg bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-blue-100/80 mb-2">Telefonnummer</label>
                  <input
                    v-model="formData.patient_phone"
                    placeholder="z.B. +49 123 456789"
                    class="w-full px-4 py-4 text-lg bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p class="text-xs text-blue-200/60 mt-1">Diese Nummer wird für Rückfragen verwendet</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-blue-100/80 mb-2">Adresse</label>
                  <input
                    v-model="formData.patient_address"
                    placeholder="z.B. Musterstraße 123"
                    class="w-full px-4 py-4 text-lg bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-blue-100/80 mb-2">PLZ</label>
                    <input
                      v-model="formData.patient_postal_code"
                      placeholder="12345"
                      class="w-full px-4 py-4 text-lg bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-blue-100/80 mb-2">Stadt</label>
                    <input
                      v-model="formData.patient_city"
                      placeholder="z.B. München"
                      class="w-full px-4 py-4 text-lg bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 2: Consent -->
        <template #consent>
          <div class="space-y-6 text-center">
            <div class="space-y-2">
              <h2 class="text-xl font-semibold text-white">Einverständniserklärung</h2>
              <p class="text-blue-100/80 text-sm">Bitte lies und bestätige die Nutzungsbedingungen</p>
            </div>
            
            <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-lg mx-auto">
              <div class="space-y-4">
                <div class="space-y-3 text-sm text-blue-100/80 text-left">
                  <p class="font-medium text-white">Ich bestätige, dass:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>KARL als KI-Assistent in meinem Namen bei der 116117 anruft</li>
                    <li>Alle angegebenen Daten korrekt und vollständig sind</li>
                    <li>Ich eine Aufnahme meiner Stimme zur Bestätigung aufnehme</li>
                    <li>Die Aufnahme nach der Verwendung oder spätestens nach 7 Tagen gelöscht wird</li>
                    <li>Ich über 18 Jahre alt bin oder die Einverständniserklärung der Erziehungsberechtigten vorliegt</li>
                  </ul>
                </div>
                
                <div
                  @click="callSetupStore.updateFormData({ consent_given: !formData.consent_given })"
                  :class="[
                    'cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 flex items-center space-x-3',
                    formData.consent_given
                      ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                  ]"
                >
                  <UIcon 
                    :name="formData.consent_given ? 'i-heroicons-check-circle' : 'i-heroicons-circle'"
                    class="w-5 h-5 flex-shrink-0"
                    :class="formData.consent_given ? 'text-blue-400' : 'text-white/40'"
                  />
                  <label class="text-sm text-blue-100/80 cursor-pointer">
                    Ich stimme allen Punkten zu und erteile KARL die Erlaubnis, in meinem Namen anzurufen
                  </label>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 3: Voice Recording -->
        <template #voice-recording>
          <div class="space-y-6 text-center">
            <div class="space-y-2">
              <h2 class="text-xl font-semibold text-white">Stimmaufnahme</h2>
              <p class="text-blue-100/80 text-sm">Nimm eine kurze Bestätigung auf</p>
            </div>
            
            <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-lg mx-auto">
              <div class="space-y-4">
                <div class="text-center space-y-2">
                  <p class="text-sm text-blue-100/80">Bitte sprich folgenden Text:</p>
                  <div class="bg-white/5 rounded-lg p-3">
                    <p class="text-white font-medium text-sm">
                      "Ich bin {{ formData.patient_name }} und bestätige, dass KARL in meinem Namen bei der 116117 anrufen darf, um einen Termin zu vereinbaren."
                    </p>
                  </div>
                </div>
                
                <div class="flex flex-col items-center space-y-4">
                  <div class="flex items-center space-x-4">
                    <button
                      @click="startRecording"
                      :disabled="isRecording || hasRecording"
                      class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UIcon name="i-heroicons-microphone" class="w-5 h-5" />
                      {{ isRecording ? 'Aufnahme läuft...' : 'Aufnahme starten' }}
                    </button>
                    
                    <button
                      v-if="isRecording"
                      @click="stopMicrophoneRecording"
                      class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition-all text-sm font-medium"
                    >
                      <UIcon name="i-heroicons-stop" class="w-5 h-5" />
                      Stopp
                    </button>
                  </div>
                  
                  <div v-if="hasRecording" class="flex items-center space-x-3">
                    <button
                      v-if="!isPlaying"
                      @click="playRecording"
                      class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm font-medium"
                    >
                      <UIcon name="i-heroicons-play" class="w-4 h-4" />
                      Abspielen
                    </button>
                    
                    <button
                      v-if="isPlaying && !isPaused"
                      @click="pauseRecording"
                      class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-all text-sm font-medium"
                    >
                      <UIcon name="i-heroicons-pause" class="w-4 h-4" />
                      Pause
                    </button>
                    
                    <button
                      v-if="isPlaying && isPaused"
                      @click="resumeRecording"
                      class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm font-medium"
                    >
                      <UIcon name="i-heroicons-play" class="w-4 h-4" />
                      Fortsetzen
                    </button>
                    
                    <button
                      v-if="isPlaying"
                      @click="stopPlayback"
                      class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm font-medium"
                    >
                      <UIcon name="i-heroicons-stop" class="w-4 h-4" />
                      Stopp
                    </button>
                    
                    <button
                      @click="deleteRecording"
                      :disabled="isPlaying"
                      class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                      Neu aufnehmen
                    </button>
                  </div>
                  
                  <div v-if="recordingError" class="text-red-400 text-sm">
                    {{ recordingError }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 4: Appointment Preferences -->
        <template #appointment-preferences>
          <div class="space-y-6 text-center">
            <div class="space-y-2">
              <h2 class="text-xl font-semibold text-white">Terminwunsch</h2>
              <p class="text-blue-100/80 text-sm">Wann hast du Zeit für einen Termin?</p>
            </div>
            
            <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-2xl mx-auto">
              <div class="space-y-6">
                <!-- Days Selection -->
                <div>
                  <label class="block text-sm font-medium text-blue-100/80 mb-2">Verfügbare Wochentage</label>
                  <p class="text-xs text-blue-200/60 mb-3">Leer lassen für jederzeit verfügbar</p>
                  <div class="grid grid-cols-7 gap-2">
                    <div 
                      v-for="day in daysOfWeek" 
                      :key="day.value"
                      class="flex flex-col items-center"
                    >
                      <input 
                        type="checkbox" 
                        :id="day.value"
                        :value="day.value"
                        v-model="formData.appointment_days"
                        class="sr-only"
                      />
                      <label 
                        :for="day.value"
                        class="w-full h-12 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium border-2"
                        :class="formData.appointment_days.includes(day.value) 
                          ? 'bg-blue-500/20 border-blue-500/50 text-white shadow-lg' 
                          : 'bg-white/5 border-white/10 text-blue-100/80 hover:bg-white/10 hover:border-blue-500/30'"
                      >
                        <span>{{ day.short }}</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <!-- Time Range -->
                <div>
                  <label class="block text-sm font-medium text-blue-100/80 mb-2">Verfügbare Uhrzeiten</label>
                  <p class="text-xs text-blue-200/60 mb-3">Leer lassen für jederzeit verfügbar</p>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs text-blue-100/60 mb-1">Von</label>
                      <input
                        v-model="formData.appointment_time_from"
                        type="time"
                        class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label class="block text-xs text-blue-100/60 mb-1">Bis</label>
                      <input
                        v-model="formData.appointment_time_to"
                        type="time"
                        class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <!-- Additional Notes -->
                <div>
                  <label class="block text-sm font-medium text-blue-100/80 mb-2">Zusätzliche Hinweise (optional)</label>
                  <textarea
                    v-model="formData.appointment_notes"
                    placeholder="z.B. Nur vormittags, nicht am Freitag nachmittag, flexibel bei Absagen..."
                    rows="3"
                    class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p class="text-xs text-blue-200/60 mt-1">Diese Informationen helfen KARL bei der Terminvereinbarung</p>
                </div>
                
                <!-- Appointment Flexibility Toggle -->
                <div
                  @click="callSetupStore.updateFormData({ appointment_flexibility: !formData.appointment_flexibility })"
                  :class="[
                    'cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105',
                    formData.appointment_flexibility
                      ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                  ]"
                >
                  <div class="flex items-start space-x-3">
                    <UIcon 
                      :name="formData.appointment_flexibility ? 'i-heroicons-check-circle' : 'i-heroicons-circle'"
                      class="w-5 h-5 flex-shrink-0 mt-0.5"
                      :class="formData.appointment_flexibility ? 'text-blue-400' : 'text-white/40'"
                    />
                    <div class="flex-1 text-left">
                      <label class="text-sm font-medium text-blue-100/80 cursor-pointer">
                        Falls beide Terminvorschläge nicht passen: KARL darf einen Termin außerhalb meiner Präferenzen annehmen
                      </label>
                      <p class="text-xs text-blue-200/60 mt-1">
                        Wenn aktiviert, nimmt KARL nach 2 Ablehnungen auch Termine an, die nicht deinen Präferenzen entsprechen. 
                        Andernfalls wird kein Termin vereinbart.
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- 116117 Process Information -->
                <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 class="text-sm font-medium text-blue-300 mb-2 flex items-center">
                    <UIcon name="i-heroicons-information-circle" class="w-4 h-4 mr-2" />
                    Wichtige Information zur 116117
                  </h4>
                  <div class="space-y-2 text-xs text-blue-200/80 text-left">
                    <p>
                      Bei der 116117 kannst du keinen Wunschtermin auswählen. 
                      Die Terminservicestelle macht dir Terminvorschläge.
                    </p>
                    <p>
                      <strong class="text-blue-200">Du kannst bis zu 2 Terminvorschläge ablehnen</strong> 
                      und um einen anderen Termin bitten.
                    </p>
                    <p>
                      Deine Verfügbarkeitsangaben helfen KARL dabei, passende Termine zu finden 
                      und unpassende höflich abzulehnen.
                    </p>
                  </div>
                </div>
                
                <!-- Preview -->
                <div class="bg-white/5 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
                  <h4 class="text-white font-medium mb-2 flex items-center">
                    <UIcon name="i-heroicons-clock" class="w-5 h-5 mr-2 text-blue-400" />
                    Deine Verfügbarkeit
                  </h4>
                  <div class="space-y-2 text-sm text-left">
                    <div>
                      <span class="text-blue-100/80">Tage: </span>
                      <span class="text-white font-medium">{{ getDaysText() }}</span>
                    </div>
                    <div>
                      <span class="text-blue-100/80">Zeit: </span>
                      <span class="text-white font-medium">
                        {{ formData.appointment_time_from && formData.appointment_time_to 
                          ? `${formData.appointment_time_from} - ${formData.appointment_time_to}` 
                          : 'Jederzeit' }}
                      </span>
                    </div>
                    <div v-if="formData.appointment_notes">
                      <span class="text-blue-100/80">Hinweise: </span>
                      <span class="text-white font-medium">{{ formData.appointment_notes }}</span>
                    </div>
                    <div>
                      <span class="text-blue-100/80">Flexibilität: </span>
                      <span class="text-white font-medium">
                        {{ formData.appointment_flexibility ? 'Termine außerhalb Präferenzen erlaubt' : 'Nur Termine in Präferenzen' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 5: Schedule Call -->
        <template #schedule>
          <div class="space-y-6 text-center">
            <div class="space-y-2">
              <h2 class="text-xl font-semibold text-white">Anruf planen</h2>
              <p class="text-blue-100/80 text-sm">Wähle, wann KARL anrufen soll</p>
            </div>
            
            <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-lg mx-auto">
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div
                    @click="callSetupStore.updateFormData({ call_timing: 'now' })"
                    :class="[
                      'cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center h-20',
                      formData.call_timing === 'now'
                        ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                        : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                    ]"
                  >
                    <UIcon name="i-heroicons-phone" class="w-6 h-6 mb-2" />
                    <span class="text-sm text-white font-medium">Sofort</span>
                  </div>
                  
                  <div
                    @click="callSetupStore.updateFormData({ call_timing: 'scheduled' })"
                    :class="[
                      'cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center h-20',
                      formData.call_timing === 'scheduled'
                        ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                        : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                    ]"
                  >
                    <UIcon name="i-heroicons-calendar" class="w-6 h-6 mb-2" />
                    <span class="text-sm text-white font-medium">Terminiert</span>
                  </div>
                </div>
                
                <div v-if="formData.call_timing === 'scheduled'" class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-blue-100/80 mb-2">
                      Datum
                    </label>
                    <VueDatePicker
                      v-model="scheduledDate"
                      :locale="'de'"
                      :format="'dd.MM.yyyy'"
                      :enable-time-picker="false"
                      :min-date="new Date()"
                      placeholder="TT.MM.JJJJ"
                      dark
                      text-input
                      :text-input-options="{
                        format: 'dd.MM.yyyy',
                        selectOnFocus: true,
                        openOnFocus: false
                      }"
                      :format-locale="deLocale"
                      ref="scheduledDatePicker"
                      input-class-name="custom-datepicker-input-small"
                      :input-icon="false"
                      :class="[
                        'w-full',
                        scheduledDateError ? 'dp-error' : ''
                      ]"
                    />
                    <p v-if="scheduledDateError" class="text-red-400 text-xs mt-1">{{ scheduledDateError }}</p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-blue-100/80 mb-2">Uhrzeit</label>
                    <input
                      v-model="formData.scheduled_time"
                      type="time"
                      class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 5: Confirmation -->
        <template #confirmation>
          <div class="space-y-6 text-center">
            <div class="space-y-2">
              <h2 class="text-xl font-semibold text-white">Zusammenfassung</h2>
              <p class="text-blue-100/80 text-sm">Überprüfe deine Angaben</p>
            </div>
            
            <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-lg mx-auto">
              <div class="space-y-4">
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-blue-100/80">Patient:</span>
                    <span :class="formData.patient_name ? 'text-white font-medium' : 'text-red-400 font-medium'">
                      {{ formData.patient_name || 'Nicht angegeben' }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-100/80">Geburtsdatum:</span>
                    <span :class="formData.patient_dob ? 'text-white font-medium' : 'text-red-400 font-medium'">
                      {{ formData.patient_dob ? formatDateForDisplay(formData.patient_dob) : 'Nicht angegeben' }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-100/80">Versicherung:</span>
                    <span :class="formData.patient_insurance ? 'text-white font-medium' : 'text-red-400 font-medium'">
                      {{ formData.patient_insurance || 'Nicht angegeben' }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-100/80">Telefon:</span>
                    <span :class="formData.patient_phone ? 'text-white font-medium' : 'text-red-400 font-medium'">
                      {{ formData.patient_phone || 'Nicht angegeben' }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-100/80">Adresse:</span>
                    <span :class="(formData.patient_address && formData.patient_postal_code && formData.patient_city) ? 'text-white font-medium' : 'text-red-400 font-medium'">
                      {{ (formData.patient_address && formData.patient_postal_code && formData.patient_city) 
                        ? `${formData.patient_address}, ${formData.patient_postal_code} ${formData.patient_city}` 
                        : 'Nicht vollständig angegeben' }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-100/80">Anruf:</span>
                    <span :class="formData.call_timing ? 'text-white font-medium' : 'text-red-400 font-medium'">
                      {{ formData.call_timing === 'now' ? 'Sofort' : 
                         formData.call_timing === 'scheduled' ? 
                           (formData.scheduled_date && formData.scheduled_time ? `${formatDateForDisplay(formData.scheduled_date)} um ${formData.scheduled_time}` : 'Datum/Zeit nicht angegeben') :
                           'Nicht angegeben' }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-100/80">Stimmaufnahme:</span>
                    <span :class="callSetupStore.hasVoiceRecording() ? 'text-green-400 font-medium' : 'text-red-400 font-medium'">
                      {{ callSetupStore.hasVoiceRecording() ? 'Verfügbar' : 'Fehlt' }}
                    </span>
                  </div>
                  <div class="border-t border-white/10 pt-3">
                    <div class="text-blue-100/80 font-medium mb-2">Terminpräferenzen:</div>
                    <div class="flex justify-between text-sm">
                      <span class="text-blue-100/60">Tage:</span>
                      <span class="text-white">{{ getDaysText() }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-blue-100/60">Zeit:</span>
                      <span class="text-white">
                        {{ formData.appointment_time_from && formData.appointment_time_to 
                          ? `${formData.appointment_time_from} - ${formData.appointment_time_to}` 
                          : 'Jederzeit' }}
                      </span>
                    </div>
                    <div v-if="formData.appointment_notes" class="text-sm">
                      <span class="text-blue-100/60">Hinweise:</span>
                      <span class="text-white block mt-1">{{ formData.appointment_notes }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-blue-100/60">Flexibilität:</span>
                      <span class="text-white">
                        {{ formData.appointment_flexibility ? 'Termine außerhalb Präferenzen erlaubt' : 'Nur Termine in Präferenzen' }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white/5 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
                  <h4 class="text-white font-medium mb-2 flex items-center">
                    <UIcon name="i-heroicons-information-circle" class="w-5 h-5 mr-2 text-blue-400" />
                    Was passiert nach dem Beauftragen?
                  </h4>
                  <ul class="text-sm text-blue-100/80 space-y-1 list-disc list-inside text-left">
                    <li>Deine Daten werden sicher gespeichert</li>
                    <li>KARL wird {{ formData.call_timing === 'now' ? 'in 5 Minuten' : `am ${formData.scheduled_date} um ${formData.scheduled_time}` }} anrufen</li>
                    <li>Der Anruf erfolgt bei der 116117 in deinem Namen</li>
                    <li>Deine Sprachaufnahme wird automatisch nach dem Anruf gelöscht</li>
                    <li>Du erhältst das Ergebnis per E-Mail (falls verfügbar)</li>
                  </ul>
                </div>
                
                <button
                  @click="submitCallSetup"
                  :disabled="!canSubmit || isSubmitting"
                  class="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <UIcon name="i-heroicons-phone" class="w-5 h-5" />
                  {{ isSubmitting ? 'Wird beauftragt...' : 'Anruf beauftragen' }}
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 6: Status -->
        <template #status>
          <div class="space-y-6 text-center">
            <div class="space-y-2">
              <h2 class="text-xl font-semibold text-white">Anruf-Status</h2>
              <p class="text-blue-100/80 text-sm">Aktueller Status deines Anrufs</p>
            </div>
            
            <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-lg mx-auto">
              <div class="space-y-4">
                <!-- Status indicator -->
                <div class="flex items-center justify-center space-x-3">
                  <div class="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  <span class="text-green-400 font-medium">Anruf erfolgreich beauftragt</span>
                </div>
                
                <!-- Call details -->
                <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <h4 class="text-white font-medium mb-2 flex items-center">
                    <UIcon name="i-heroicons-clock" class="w-5 h-5 mr-2 text-blue-400" />
                    Anruf-Details
                  </h4>
                  <div class="space-y-2 text-sm text-left">
                    <div class="flex justify-between">
                      <span class="text-blue-100/80">Patient:</span>
                      <span class="text-white font-medium">{{ callStatus?.patient_name || formData.patient_name }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-blue-100/80">Geplante Zeit:</span>
                      <span class="text-white font-medium">
                        {{ (callStatus?.call_timing || formData.call_timing) === 'now' ? 'In 5 Minuten' : `${formatDateForDisplay(callStatus?.scheduled_date || formData.scheduled_date)} um ${callStatus?.scheduled_time || formData.scheduled_time}` }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-blue-100/80">Status:</span>
                      <span class="text-yellow-400 font-medium">{{ callStatus?.status === 'pending' ? 'Warten auf Anruf' : 'Unbekannt' }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Timeline -->
                <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <h4 class="text-white font-medium mb-3 flex items-center">
                    <UIcon name="i-heroicons-list-bullet" class="w-5 h-5 mr-2 text-blue-400" />
                    Ablauf
                  </h4>
                  <div class="space-y-3 text-sm text-left">
                    <div class="flex items-center space-x-3">
                      <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span class="text-green-400">Anruf beauftragt</span>
                      <span class="text-blue-100/60 ml-auto">{{ new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) }}</span>
                    </div>
                    <div class="flex items-center space-x-3">
                      <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span class="text-yellow-400">Warten auf geplante Zeit</span>
                    </div>
                    <div class="flex items-center space-x-3">
                      <div class="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span class="text-gray-400">Anruf bei 116117</span>
                    </div>
                    <div class="flex items-center space-x-3">
                      <div class="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span class="text-gray-400">Ergebnis verfügbar</span>
                    </div>
                  </div>
                </div>
                
                <!-- Result placeholder -->
                <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <h4 class="text-white font-medium mb-2 flex items-center">
                    <UIcon name="i-heroicons-document-text" class="w-5 h-5 mr-2 text-blue-400" />
                    Ergebnis
                  </h4>
                  <p class="text-blue-100/80 text-sm">Das Ergebnis des Anrufs wird hier angezeigt, sobald KARL den Anruf durchgeführt hat.</p>
                </div>
                
                <!-- Actions -->
                <div class="flex gap-3">
                  <button
                    @click="() => { 
                      localStorage.removeItem('karlLastCallStatus');
                      localStorage.removeItem('karlLastCallTime');
                      callStatus.value = null;
                      setCurrentStep(0);
                    }"
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm font-medium rounded-lg"
                  >
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    Neuer Anruf
                  </button>
                  <button
                    @click="navigateTo('/admin')"
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition-all text-sm font-medium rounded-lg"
                  >
                    <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UStepper>

        <!-- Navigation -->
        <div class="flex justify-between w-full mt-8" v-if="currentStep < setupSteps.length - 2">
          <UButton
            @click="prevStep"
            variant="ghost"
            color="white"
            icon="i-heroicons-arrow-left"
          >
            {{ currentStep === 0 ? 'Admin Dashboard' : 'Zurück' }}
          </UButton>
          
          <UButton
            :disabled="!canProceed"
            @click="nextStep"
            color="primary"
            trailing-icon="i-heroicons-arrow-right"
          >
            {{ currentStep === setupSteps.length - 3 ? 'Überprüfen' : 'Weiter' }}
          </UButton>
        </div>
      </div>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { useCallSetupStore } from '~/stores/callSetup'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { de } from 'date-fns/locale'

// Page meta and auth
definePageMeta({
  title: 'Call Setup - KARL',
  middleware: ['admin-auth'] // Will need to create this middleware
})

// Store
const callSetupStore = useCallSetupStore()

// Reactive references
const stepper = ref()
const currentStep = ref(0)
const isSubmitting = ref(false)
const isLoading = ref(true)
const toast = useToast()

// Date input handling
const birthDate = ref<Date | null>(null)
const birthDateError = ref('')
const scheduledDate = ref<Date | null>(null)
const scheduledDateError = ref('')
const birthDatePicker = ref()
const scheduledDatePicker = ref()

// German locale for date-fns
const deLocale = de

// Voice recording
const isRecording = ref(false)
const recordingError = ref('')
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks = ref<Blob[]>([])

// Voice recording state from store
const hasRecording = computed(() => callSetupStore.hasVoiceRecording())
const audioBlob = computed(() => callSetupStore.getVoiceRecordingBlob())

// Voice playback
const isPlaying = ref(false)
const isPaused = ref(false)
const currentAudio = ref<HTMLAudioElement | null>(null)

// Form data from store
const formData = computed(() => callSetupStore.formData)

// Call status from localStorage for status step
const callStatus = ref(null)
const loadCallStatus = () => {
  const status = localStorage.getItem('karlLastCallStatus')
  if (status) {
    callStatus.value = JSON.parse(status)
  }
}

// Days of week for appointment preferences (Monday to Sunday)
const daysOfWeek = computed(() => {
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const fullDayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
  
  return dayNames.map((short, index) => ({
    value: fullDayNames[index],
    short: short
  }))
})

// Stepper configuration
const setupSteps = ref([
  {
    slot: 'patient-info',
    title: 'Patientendaten',
    description: 'Persönliche Informationen',
    icon: 'i-heroicons-user'
  },
  {
    slot: 'consent',
    title: 'Einverständnis',
    description: 'Zustimmung zur Nutzung',
    icon: 'i-heroicons-check-circle'
  },
  {
    slot: 'voice-recording',
    title: 'Sprachaufnahme',
    description: 'Bestätigung aufnehmen',
    icon: 'i-heroicons-microphone'
  },
  {
    slot: 'appointment-preferences',
    title: 'Terminwunsch',
    description: 'Verfügbare Zeiten',
    icon: 'i-heroicons-clock'
  },
  {
    slot: 'schedule',
    title: 'Zeitplanung',
    description: 'Anruf terminieren',
    icon: 'i-heroicons-calendar'
  },
  {
    slot: 'confirmation',
    title: 'Bestätigung',
    description: 'Angaben überprüfen',
    icon: 'i-heroicons-paper-airplane'
  },
  {
    slot: 'status',
    title: 'Anruf-Status',
    description: 'Aktueller Status',
    icon: 'i-heroicons-signal'
  }
])

// Helper functions
const getDaysText = () => {
  if (formData.value.appointment_days.length === 0) return 'Jederzeit'
  if (formData.value.appointment_days.length === 7) return 'Täglich'
  return formData.value.appointment_days.join(', ')
}

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Simple and robust German date formatting
const formatGermanDateInput = (input: string): string => {
  // Keep only digits
  const digits = input.replace(/\D/g, '')
  
  if (digits.length === 0) return ''
  
  let formatted = ''
  
  // Day part (first 2 digits)
  if (digits.length >= 1) {
    const day = digits.slice(0, 2)
    
    if (digits.length === 1) {
      // Single digit - check if it needs auto-prefix
      if (parseInt(digits[0]) > 3) {
        formatted = '0' + digits[0] + '.'
      } else {
        formatted = digits[0]
      }
    } else if (digits.length === 2) {
      // Exactly two digits for day - always add dot
      formatted = day + '.'
    } else {
      // More than two digits - day is complete
      formatted = day + '.'
    }
  }
  
  // Month part (next 2 digits)
  if (digits.length >= 3) {
    const month = digits.slice(2, 4)
    
    if (digits.length === 3) {
      // Single digit month - check if it needs auto-prefix
      if (parseInt(digits[2]) > 1) {
        formatted += '0' + digits[2] + '.'
      } else {
        formatted += digits[2]
      }
    } else if (digits.length === 4) {
      // Exactly two digits for month - always add dot
      formatted += month + '.'
    } else {
      // More than two digits - month is complete
      formatted += month + '.'
    }
  }
  
  // Year part (last 4 digits)
  if (digits.length >= 5) {
    const year = digits.slice(4, 8)
    formatted += year
  }
  
  return formatted
}

const handleBirthDateInput = (event: any) => {
  const input = event.target?.value || ''
  const cursorPos = event.target?.selectionStart || 0
  const oldValue = input
  
  const formatted = formatGermanDateInput(input)
  
  if (event.target) {
    event.target.value = formatted
    
    // Smart cursor positioning
    setTimeout(() => {
      if (event.target) {
        let newCursorPos = cursorPos
        
        // Handle deletion - if cursor is at a dot position, move it back
        if (formatted.length < oldValue.length) {
          // We deleted something
          newCursorPos = Math.min(formatted.length, cursorPos)
          
          // If cursor ends up at a dot, move it before the dot
          if (formatted[newCursorPos] === '.') {
            newCursorPos = Math.max(0, newCursorPos - 1)
          }
        } else if (formatted.length > oldValue.length) {
          // We added something (likely a dot)
          newCursorPos = Math.min(formatted.length, cursorPos + (formatted.length - oldValue.length))
        }
        
        event.target.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }
  
  // Clear error when typing
  birthDateError.value = ''
}

const handleScheduledDateInput = (event: any) => {
  const input = event.target?.value || ''
  const cursorPos = event.target?.selectionStart || 0
  const oldValue = input
  
  const formatted = formatGermanDateInput(input)
  
  if (event.target) {
    event.target.value = formatted
    
    // Smart cursor positioning
    setTimeout(() => {
      if (event.target) {
        let newCursorPos = cursorPos
        
        // Handle deletion - if cursor is at a dot position, move it back
        if (formatted.length < oldValue.length) {
          // We deleted something
          newCursorPos = Math.min(formatted.length, cursorPos)
          
          // If cursor ends up at a dot, move it before the dot
          if (formatted[newCursorPos] === '.') {
            newCursorPos = Math.max(0, newCursorPos - 1)
          }
        } else if (formatted.length > oldValue.length) {
          // We added something (likely a dot)
          newCursorPos = Math.min(formatted.length, cursorPos + (formatted.length - oldValue.length))
        }
        
        event.target.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }
  
  // Clear error when typing
  scheduledDateError.value = ''
}

// Handle keydown events to skip over dots when deleting
const handleKeyDown = (event: any) => {
  const input = event.target?.value || ''
  const cursorPos = event.target?.selectionStart || 0
  
  // Handle backspace when cursor is right after a dot
  if (event.key === 'Backspace' && cursorPos > 0 && input[cursorPos - 1] === '.') {
    event.preventDefault()
    // Move cursor before the dot and delete the digit before it
    const newCursorPos = Math.max(0, cursorPos - 2)
    const newValue = input.slice(0, newCursorPos) + input.slice(cursorPos)
    event.target.value = newValue
    event.target.setSelectionRange(newCursorPos, newCursorPos)
    
    // Trigger formatting
    setTimeout(() => {
      const formatted = formatGermanDateInput(newValue)
      event.target.value = formatted
      const finalCursorPos = Math.min(formatted.length, newCursorPos)
      event.target.setSelectionRange(finalCursorPos, finalCursorPos)
    }, 0)
  }
  
  // Handle delete when cursor is right before a dot
  if (event.key === 'Delete' && cursorPos < input.length && input[cursorPos] === '.') {
    event.preventDefault()
    // Delete the digit after the dot
    const newValue = input.slice(0, cursorPos) + input.slice(cursorPos + 2)
    event.target.value = newValue
    event.target.setSelectionRange(cursorPos, cursorPos)
    
    // Trigger formatting
    setTimeout(() => {
      const formatted = formatGermanDateInput(newValue)
      event.target.value = formatted
      const finalCursorPos = Math.min(formatted.length, cursorPos)
      event.target.setSelectionRange(finalCursorPos, finalCursorPos)
    }, 0)
  }
}

// Date watchers to update store when dates change
watch(birthDate, (newDate) => {
  birthDateError.value = ''
  if (newDate) {
    const isoDate = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`
    callSetupStore.updateFormData({ patient_dob: isoDate })
  } else {
    callSetupStore.updateFormData({ patient_dob: '' })
  }
})

watch(scheduledDate, (newDate) => {
  scheduledDateError.value = ''
  if (newDate) {
    const isoDate = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`
    callSetupStore.updateFormData({ scheduled_date: isoDate })
  } else {
    callSetupStore.updateFormData({ scheduled_date: '' })
  }
})

// Validation logic
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: // Patient info
      return formData.value.patient_name && 
             formData.value.patient_dob && 
             formData.value.patient_insurance && 
             formData.value.patient_phone && 
             formData.value.patient_address && 
             formData.value.patient_postal_code && 
             formData.value.patient_city
    case 1: // Consent
      return formData.value.consent_given
    case 2: // Voice recording
      return callSetupStore.hasVoiceRecording()
    case 3: // Appointment preferences (optional, always allowed to proceed)
      return true
    case 4: // Schedule
      return formData.value.call_timing && 
             (formData.value.call_timing === 'now' || 
              (formData.value.scheduled_date && formData.value.scheduled_time))
    case 5: // Confirmation
      return true
    case 6: // Status (always allowed)
      return true
    default:
      return false
  }
})

const canSubmit = computed(() => {
  return formData.value.patient_name && 
         formData.value.patient_phone && 
         formData.value.consent_given && 
         callSetupStore.hasVoiceRecording() && 
         formData.value.call_timing
})

// Navigation functions
const setCurrentStep = (step: number) => {
  currentStep.value = step
  callSetupStore.setCurrentStep(step)
}

const nextStep = () => {
  if (canProceed.value && currentStep.value < setupSteps.value.length - 1) {
    setCurrentStep(currentStep.value + 1)
  }
}

const prevStep = () => {
  if (currentStep.value === 0) {
    navigateTo('/admin')
  } else {
    setCurrentStep(currentStep.value - 1)
  }
}

// Voice recording functions
const startRecording = async () => {
  try {
    recordingError.value = ''
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    mediaRecorder.value = new MediaRecorder(stream)
    recordedChunks.value = []
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data)
      }
    }
    
    mediaRecorder.value.onstop = async () => {
      const audioBlob = new Blob(recordedChunks.value, { type: 'audio/wav' })
      
      // Save to store (persists to localStorage)
      await callSetupStore.saveVoiceRecording(audioBlob)
      
      // Stop all audio tracks
      stream.getTracks().forEach(track => track.stop())
    }
    
    mediaRecorder.value.start()
    isRecording.value = true
    
    setTimeout(() => {
      if (isRecording.value) {
        stopMicrophoneRecording()
      }
    }, 30000) // Auto-stop after 30 seconds
    
  } catch (error) {
    recordingError.value = 'Mikrofon-Zugriff verweigert oder nicht verfügbar'
    console.error('Recording error:', error)
  }
}

const stopMicrophoneRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
  }
}

const playRecording = () => {
  if (audioBlob.value) {
    // Stop any currently playing audio
    if (currentAudio.value) {
      currentAudio.value.pause()
      currentAudio.value.currentTime = 0
    }
    
    currentAudio.value = new Audio(URL.createObjectURL(audioBlob.value))
    isPlaying.value = true
    isPaused.value = false
    
    currentAudio.value.addEventListener('ended', () => {
      isPlaying.value = false
      isPaused.value = false
      currentAudio.value = null
    })
    
    currentAudio.value.addEventListener('error', () => {
      isPlaying.value = false
      isPaused.value = false
      currentAudio.value = null
      recordingError.value = 'Fehler beim Abspielen der Aufnahme'
    })
    
    currentAudio.value.play()
  }
}

const pauseRecording = () => {
  if (currentAudio.value && isPlaying.value) {
    currentAudio.value.pause()
    isPaused.value = true
  }
}

const resumeRecording = () => {
  if (currentAudio.value && isPlaying.value && isPaused.value) {
    currentAudio.value.play()
    isPaused.value = false
  }
}

const stopPlayback = () => {
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value.currentTime = 0
    isPlaying.value = false
    isPaused.value = false
    currentAudio.value = null
  }
}

const deleteRecording = () => {
  // Stop playback if currently playing
  stopPlayback()
  
  // Clear from store (removes from localStorage)
  callSetupStore.clearVoiceRecording()
  recordedChunks.value = []
}

// Submit function
const submitCallSetup = async () => {
  if (!canSubmit.value) return
  
  try {
    isSubmitting.value = true
    
    // Create FormData with audio
    const formDataToSend = new FormData()
    formDataToSend.append('patient_name', formData.value.patient_name)
    formDataToSend.append('patient_dob', formData.value.patient_dob)
    formDataToSend.append('patient_insurance', formData.value.patient_insurance)
    formDataToSend.append('patient_phone', formData.value.patient_phone)
    formDataToSend.append('patient_address', formData.value.patient_address)
    formDataToSend.append('patient_postal_code', formData.value.patient_postal_code)
    formDataToSend.append('patient_city', formData.value.patient_city)
    formDataToSend.append('call_timing', formData.value.call_timing)
    
    if (formData.value.call_timing === 'scheduled') {
      formDataToSend.append('scheduled_date', formData.value.scheduled_date)
      formDataToSend.append('scheduled_time', formData.value.scheduled_time)
    }
    
    // Append appointment preferences
    if (formData.value.appointment_days.length > 0) {
      formDataToSend.append('appointment_days', formData.value.appointment_days.join(','))
    }
    if (formData.value.appointment_time_from) {
      formDataToSend.append('appointment_time_from', formData.value.appointment_time_from)
    }
    if (formData.value.appointment_time_to) {
      formDataToSend.append('appointment_time_to', formData.value.appointment_time_to)
    }
    // Append appointment notes with flexibility setting
    let appointmentNotes = formData.value.appointment_notes
    if (formData.value.appointment_flexibility) {
      appointmentNotes += (appointmentNotes ? '\n\n' : '') + 'FLEXIBILITÄT: KARL darf nach 2 Ablehnungen auch Termine außerhalb der Präferenzen annehmen.'
    } else {
      appointmentNotes += (appointmentNotes ? '\n\n' : '') + 'FLEXIBILITÄT: KARL soll nach 2 Ablehnungen KEINEN Termin außerhalb der Präferenzen annehmen.'
    }
    if (appointmentNotes) {
      formDataToSend.append('appointment_notes', appointmentNotes)
    }
    
    const voiceBlob = callSetupStore.getVoiceRecordingBlob()
    if (voiceBlob) {
      formDataToSend.append('voice_recording', voiceBlob, formData.value.voice_recording_filename || 'consent.wav')
    }
    
    // Make API call with HttpOnly cookies for authentication
    const response = await $fetch('/api/admin/call-setup', {
      method: 'POST',
      body: formDataToSend
    })
    
    toast.add({
      title: 'Anruf erfolgreich beauftragt',
      description: 'KARL wird ihn bald bearbeiten.',
      color: 'green'
    })
    
    // Don't clear form data for multiple calls - only clear voice recording
    callSetupStore.clearVoiceRecording()
    
    // Set call status in localStorage for reload handling
    localStorage.setItem('karlLastCallStatus', JSON.stringify({
      patient_name: formData.value.patient_name,
      call_timing: formData.value.call_timing,
      scheduled_date: formData.value.scheduled_date,
      scheduled_time: formData.value.scheduled_time,
      status: 'pending'
    }))
    localStorage.setItem('karlLastCallTime', Date.now().toString())
    
    // Go to status step to show call progress
    setCurrentStep(setupSteps.value.length - 1)
    
  } catch (error) {
    console.error('Submit error:', error)
    toast.add({
      title: 'Fehler beim Beauftragen',
      description: 'Bitte versuche es erneut',
      color: 'red'
    })
  } finally {
    isSubmitting.value = false
  }
}

// Initialize store
onMounted(() => {
  // Load call status from localStorage
  loadCallStatus()
  
  // Initialize date inputs from store data
  if (formData.value.patient_dob) {
    birthDate.value = new Date(formData.value.patient_dob)
  }
  
  if (formData.value.scheduled_date) {
    scheduledDate.value = new Date(formData.value.scheduled_date)
  } else {
    // Set default scheduled date to today
    const now = new Date()
    scheduledDate.value = now
    callSetupStore.updateFormData({ scheduled_date: now.toISOString().split('T')[0] })
  }
  
  
  // Check if we're returning from a reload and have call status
  const hasRecentCall = localStorage.getItem('karlLastCallStatus')
  const lastCallTime = localStorage.getItem('karlLastCallTime')
  
  // If there's a recent call (within last 30 minutes), show status
  if (hasRecentCall && lastCallTime) {
    const timeDiff = Date.now() - parseInt(lastCallTime)
    if (timeDiff < 30 * 60 * 1000) { // 30 minutes
      currentStep.value = setupSteps.value.length - 1 // Go to status step
    } else {
      currentStep.value = callSetupStore.currentStep
    }
  } else {
    currentStep.value = callSetupStore.currentStep
  }
  
  nextTick(() => {
    isLoading.value = false
    
    // Add event listeners to datepicker inputs for smart formatting
    setTimeout(() => {
      if (birthDatePicker.value) {
        const birthInput = birthDatePicker.value.$el.querySelector('input')
        if (birthInput) {
          birthInput.addEventListener('input', handleBirthDateInput)
          birthInput.addEventListener('keyup', handleBirthDateInput)
          birthInput.addEventListener('keydown', handleKeyDown)
          birthInput.addEventListener('paste', (e) => {
            setTimeout(() => handleBirthDateInput(e), 0)
          })
        }
      }
      
      if (scheduledDatePicker.value) {
        const scheduledInput = scheduledDatePicker.value.$el.querySelector('input')
        if (scheduledInput) {
          scheduledInput.addEventListener('input', handleScheduledDateInput)
          scheduledInput.addEventListener('keyup', handleScheduledDateInput)
          scheduledInput.addEventListener('keydown', handleKeyDown)
          scheduledInput.addEventListener('paste', (e) => {
            setTimeout(() => handleScheduledDateInput(e), 0)
          })
        }
      }
    }, 100)
  })
})
</script>

<style>
/* Vue DatePicker Custom Styling for Dark Theme */
.dp__theme_dark {
  --dp-background-color: rgba(30, 41, 59, 0.95);
  --dp-text-color: #e2e8f0;
  --dp-hover-color: rgba(59, 130, 246, 0.2);
  --dp-hover-text-color: #ffffff;
  --dp-hover-icon-color: #ffffff;
  --dp-primary-color: #3b82f6;
  --dp-primary-text-color: #ffffff;
  --dp-secondary-color: rgba(255, 255, 255, 0.1);
  --dp-border-color: rgba(255, 255, 255, 0.15);
  --dp-menu-border-color: rgba(255, 255, 255, 0.15);
  --dp-border-color-hover: #3b82f6;
  --dp-disabled-color: rgba(255, 255, 255, 0.3);
  --dp-scroll-bar-background: rgba(255, 255, 255, 0.1);
  --dp-scroll-bar-color: rgba(255, 255, 255, 0.3);
  --dp-success-color: #22c55e;
  --dp-success-color-disabled: rgba(34, 197, 94, 0.5);
  --dp-icon-color: rgba(255, 255, 255, 0.6);
  --dp-danger-color: #ef4444;
  --dp-highlight-color: rgba(59, 130, 246, 0.2);
}

/* Calendar popup styling */
.dp__menu {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98)) !important;
  backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 16px !important;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05) !important;
  padding: 20px !important;
}

/* Calendar header styling */
.dp__calendar_header {
  background: rgba(255, 255, 255, 0.08) !important;
  border-radius: 12px !important;
  margin-bottom: 16px !important;
  padding: 12px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Month/year selection buttons */
.dp__month_year_select {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  padding: 8px 12px !important;
  font-weight: 600 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.dp__month_year_select:hover {
  background: rgba(59, 130, 246, 0.3) !important;
  border-color: rgba(59, 130, 246, 0.5) !important;
  transform: translateY(-1px) !important;
}

/* Navigation arrows */
.dp__arrow_top {
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  width: 32px !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.dp__arrow_top:hover {
  background: rgba(59, 130, 246, 0.3) !important;
  border-color: rgba(59, 130, 246, 0.5) !important;
  transform: translateY(-1px) !important;
}

/* Calendar grid */
.dp__calendar {
  padding: 8px !important;
}

/* Week day headers */
.dp__calendar_header_item {
  color: rgba(255, 255, 255, 0.7) !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  padding: 8px !important;
}

/* Date cells */
.dp__calendar_item {
  border-radius: 8px !important;
  margin: 2px !important;
  transition: all 0.2s ease !important;
  border: 1px solid transparent !important;
}

.dp__today {
  background: rgba(59, 130, 246, 0.25) !important;
  color: #ffffff !important;
  border: 1px solid rgba(59, 130, 246, 0.6) !important;
  font-weight: 600 !important;
}

.dp__active_date {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  border: 1px solid rgba(59, 130, 246, 0.8) !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

.dp__date_hover {
  background: rgba(59, 130, 246, 0.15) !important;
  color: #ffffff !important;
  border: 1px solid rgba(59, 130, 246, 0.3) !important;
  transform: translateY(-1px) !important;
}

.dp__cell_disabled {
  color: rgba(255, 255, 255, 0.3) !important;
  background: rgba(255, 255, 255, 0.02) !important;
}

/* Custom input classes for datepicker */
.custom-datepicker-input {
  width: 100% !important;
  padding: 1rem !important; /* py-4 px-4 */
  font-size: 1.125rem !important; /* text-lg */
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 0.5rem !important;
  color: white !important;
  transition: all 0.2s ease !important;
  min-height: 3.5rem !important;
}

.custom-datepicker-input-small {
  width: 100% !important;
  padding: 0.75rem 1rem !important; /* py-3 px-4 */
  font-size: 1.125rem !important; /* text-lg */
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 0.5rem !important;
  color: white !important;
  transition: all 0.2s ease !important;
  min-height: 3rem !important;
}

.custom-datepicker-input:focus,
.custom-datepicker-input-small:focus {
  border-color: #3b82f6 !important;
  outline: none !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
}

.custom-datepicker-input::placeholder,
.custom-datepicker-input-small::placeholder {
  color: rgba(255, 255, 255, 0.4) !important;
}

/* Input field styling to match other form fields */
.dp__input_wrap {
  position: relative !important;
}

.dp__input_wrap input {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  transition: all 0.2s ease !important;
  /* Ensure exact match with other inputs */
  font-size: 1.125rem !important; /* text-lg */
  line-height: 1.75rem !important;
}

.dp__input_wrap input:focus {
  border-color: #3b82f6 !important;
  outline: none !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
  background: rgba(255, 255, 255, 0.05) !important;
}

.dp__input_wrap input::placeholder {
  color: rgba(255, 255, 255, 0.4) !important;
}

/* Hide any default datepicker icons */
.dp__input_icon {
  display: none !important;
}

/* Error states */
.dp-error .dp__input_wrap input,
.dp-error .custom-datepicker-input,
.dp-error .custom-datepicker-input-small {
  border-color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.05) !important;
}

.dp-error .dp__input_wrap input:focus,
.dp-error .custom-datepicker-input:focus,
.dp-error .custom-datepicker-input-small:focus {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5) !important;
}

/* Override any default datepicker styling that might interfere */
.dp__input_wrap .dp__input {
  height: auto !important;
  padding: 1rem !important; /* py-4 px-4 */
}

/* Ensure consistent height with other inputs */
.dp__input_wrap input {
  min-height: 3.5rem !important; /* Match py-4 with text-lg */
}

/* Action buttons */
.dp__action_buttons {
  background: rgba(255, 255, 255, 0.05) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding: 16px !important;
  border-radius: 0 0 16px 16px !important;
  margin: 20px -20px -20px -20px !important;
  display: flex !important;
  gap: 12px !important;
}

.dp__action_button {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 12px 20px !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  flex: 1 !important;
}

.dp__action_button:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

.dp__action_cancel {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  flex: 1 !important;
}

.dp__action_cancel:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  transform: translateY(-1px) !important;
}
</style>