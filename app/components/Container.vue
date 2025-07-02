<template>
  <div class="rmterp">
    <div class="fzypcq">
      <slot />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.rmterp {
  @apply relative flex min-h-screen items-start justify-center px-4 py-6 sm:py-8;
  padding-top: max(env(safe-area-inset-top), 1rem);
  background: linear-gradient(135deg, #152a4d 0%, #1e40af 25%, #0d5d56 50%, #134155 75%, #1e2d6b 100%);
  min-height: 100vh;
  min-height: 100dvh;
}

@media (min-width: 640px) {
  .rmterp {
    padding-top: max(env(safe-area-inset-top), 2rem);
  }
}

.fzypcq {
  @apply relative mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 mt-2 sm:mt-4 mb-8;
}
</style>
