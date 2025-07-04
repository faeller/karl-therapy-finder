# KARL Translation Status

This document tracks the translation progress for KARL (Kontakt Automatisierung Richtung Leben).

## Languages
- 🇩🇪 **German (de)** - Default language, native content
- 🇬🇧 **English (en)** - Secondary language for international users

## Translation Progress

### ✅ Completed Pages/Components

| Page/Component | German | English | Notes |
|---------------|--------|---------|-------|
| Landing Page (index.vue) | ✅ Native | 🚧 Partial | Basic translations added to locales |
| App Guide Step 1 | ✅ Native | 🚧 Partial | First step translations added |
| Navigation | ✅ Native | 🚧 Partial | Basic nav translations |
| Common Elements | ✅ Native | 🚧 Partial | Buttons, labels, etc. |

### 🚧 In Progress

| Page/Component | Status | Priority | Notes |
|---------------|--------|----------|-------|
| Landing Page Implementation | In Progress | High | Need to implement i18n in template |
| App Guide Step 1 Implementation | In Progress | High | Need to implement i18n in template |

### ⏳ Pending Translation

| Page/Component | Priority | Estimated Effort | Notes |
|---------------|----------|------------------|-------|
| App Guide Steps 2-7 | High | Medium | Core therapy guide content |
| Onboarding Flow | Medium | Small | User profile setup |
| Therapist Search | Medium | Medium | Search interface and results |
| Error Pages | Low | Small | 404, 500, etc. |
| Legal Pages | Low | Large | Privacy policy, terms (if added) |

### 📝 Translation Guidelines

1. **Tone & Voice**
   - German: Direct, realistic, slightly sarcastic about bureaucracy
   - English: Professional but approachable, explain German healthcare context

2. **Technical Terms**
   - Keep German healthcare terms in German with English explanations
   - "Kostenerstattungsverfahren" → "Cost reimbursement procedure (Kostenerstattungsverfahren)"
   - "Terminservicestelle" → "Appointment service center (Terminservicestelle)"

3. **Cultural Context**
   - English version should explain German healthcare peculiarities
   - Keep references to German laws (§ 13 Abs. 3 SGB V) with context

4. **Emojis & Formatting**
   - Keep emojis consistent across languages
   - Maintain visual hierarchy and formatting

## Implementation Status

### ✅ Setup Complete
- [x] @nuxtjs/i18n module installed
- [x] Basic i18n configuration in nuxt.config.ts
- [x] German (de.json) base translations
- [x] English (en.json) base translations
- [x] Locale strategy configured (prefix_except_default)

### 🚧 Currently Working On
- [ ] Implement i18n in landing page template
- [ ] Implement i18n in app guide Step 1
- [ ] Add language switcher component

### ⏳ Todo
- [ ] Complete remaining guide steps translations
- [ ] Implement i18n in onboarding flow
- [ ] Implement i18n in therapist search
- [ ] Add language switcher to navigation
- [ ] Test translations with screen readers
- [ ] Add meta tags translations for SEO

## Notes

- **Primary Market**: German users seeking therapy in Germany
- **Secondary Market**: English-speaking expats/internationals in Germany
- **Content Strategy**: German-first with comprehensive English support
- **SEO**: Both languages should have proper meta tags and structured data

## Last Updated
{current_date} - Initial i18n setup and base translations completed