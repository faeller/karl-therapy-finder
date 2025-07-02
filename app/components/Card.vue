<template>
  <div class="card">
    <slot />
  </div>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  border-radius: 2.375rem;
  color: white;
  background: transparent !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
    0 8px 32px rgba(0, 0, 0, 0.3);
}

.card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  border-radius: inherit;
  z-index: -1;
}

/* Add a subtle gradient overlay */
.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  z-index: 1;
}
</style>
