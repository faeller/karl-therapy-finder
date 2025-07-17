<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div class="text-center">
      <!-- Icon Spinner (default) -->
      <UIcon 
        v-if="type === 'icon'"
        name="i-heroicons-arrow-path" 
        :class="[
          'animate-spin mx-auto',
          sizeClass,
          colorClass,
          message ? 'mb-3' : ''
        ]" 
      />
      
      <!-- Border Spinner -->
      <div 
        v-else-if="type === 'border'"
        :class="[
          'animate-spin rounded-full border-b-2 mx-auto',
          sizeClass,
          borderColorClass,
          message ? 'mb-3' : ''
        ]"
      ></div>
      
      <!-- Message -->
      <p v-if="message" :class="['text-sm', messageColorClass]">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'icon' | 'border'
  size?: 'sm' | 'md' | 'lg'
  color?: 'purple' | 'blue' | 'green' | 'white' | 'gray'
  message?: string
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'border',
  size: 'md',
  color: 'white',
  containerClass: 'py-8'
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-4 h-4'
    case 'md': return 'w-8 h-8'
    case 'lg': return 'w-12 h-12'
    default: return 'w-8 h-8'
  }
})

const colorClass = computed(() => {
  switch (props.color) {
    case 'purple': return 'text-purple-400'
    case 'blue': return 'text-blue-400'
    case 'green': return 'text-green-400'
    case 'white': return 'text-white'
    case 'gray': return 'text-gray-400'
    default: return 'text-purple-400'
  }
})

const borderColorClass = computed(() => {
  switch (props.color) {
    case 'purple': return 'border-purple-400'
    case 'blue': return 'border-blue-400'
    case 'green': return 'border-green-400'
    case 'white': return 'border-white'
    case 'gray': return 'border-gray-400'
    default: return 'border-white'
  }
})

const messageColorClass = computed(() => {
  switch (props.color) {
    case 'purple': return 'text-purple-200'
    case 'blue': return 'text-blue-200'
    case 'green': return 'text-green-200'
    case 'white': return 'text-white/80'
    case 'gray': return 'text-gray-300'
    default: return 'text-purple-200'
  }
})
</script>