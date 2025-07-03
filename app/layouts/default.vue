<template>
  <Container>
    <div class="fade-container">
      <slot />
    </div>
    <AppFooter />
  </Container>
</template>

<style lang="postcss">
.scrollable-card {
  scrollbar-width: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 250ms;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.button {
  box-shadow:
    inset 0.5px 0.5px 1px 0px rgba(255, 255, 255, 0.1),
    inset -0.5px -0.5px 1px 0px rgba(0, 0, 0, 0.1),
    rgba(0, 0, 0, 0.2) 0px 3px 10px -5px;
  @apply flex items-center justify-center gap-2 rounded-full text-sm backdrop-blur-sm transition-all;
}
.button:active {
  @apply scale-95;
}

* {
  scrollbar-color: #555 rgba(0, 0, 0, 0);
}

/* Prevent unwanted text selection and cursor on container elements */
.bg-white\/5, .backdrop-blur-sm, [class*="bg-white/"], [class*="backdrop-blur"],
.rounded-lg, .rounded-xl, .rounded-full, .rounded-3xl,
.border, .border-white\/10, .border-blue-500\/20,
.flex.items-center, .flex.justify-between, .flex.gap-,
.space-y-, .space-x-, .grid, .w-full, .max-w-,
.p-4, .p-6, .px-, .py-, .pt-, .pb-, .pl-, .pr-,
.m-, .mt-, .mb-, .ml-, .mr-, .mx-, .my-,
.shadow, .shadow-xl, .shadow-2xl,
.transition-all, .duration-, .ease-,
.relative, .absolute, .fixed, .sticky {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  cursor: default;
}

/* Disable text selection on all text content as well */
p, span, h1, h2, h3, h4, h5, h6, li, a,
.text-, [class*="text-"],
.font-, [class*="font-"],
.selectable-text {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  cursor: default !important;
}

/* Ensure interactive elements have proper cursor */
button, .button, [role="button"], 
.cursor-pointer, [class*="hover:"],
input, textarea, select,
a, [role="link"] {
  cursor: pointer !important;
  user-select: none;
}

/* Special handling for progress bars and decorative elements */
.bg-gradient-to-r, .bg-gradient-to-l, .bg-gradient-to-t, .bg-gradient-to-b,
.animate-, [class*="animate-"],
.scale-, .rotate-, .translate-,
[class*="scale-"], [class*="rotate-"], [class*="translate-"] {
  user-select: none !important;
  cursor: default !important;
}
</style>
