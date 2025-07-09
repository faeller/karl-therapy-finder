export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
}

export interface EmailData {
  fullName: string
  problems: string[]
  age?: string
  insurance?: string
  template: EmailTemplate
}

export const useEmailTemplates = () => {
  const templates: EmailTemplate[] = [
    {
      id: 'initial-inquiry',
      name: 'Erste Terminanfrage',
      subject: 'Terminanfrage für Psychotherapie',
      body: `Guten Tag,

ich bin auf der Suche nach einem Psychotherapieplatz und möchte gerne einen Termin für ein Erstgespräch vereinbaren.

Zu meiner Person:
Name: {fullName}{age}
{problems}
{insurance}
Ich würde mich über eine Rückmeldung bezüglich der Verfügbarkeit von Terminen freuen.

Vielen Dank für Ihre Zeit und Mühe.

Mit freundlichen Grüßen
{fullName}`
    },
    {
      id: 'follow-up',
      name: 'Nachfrage nach Wartezeit',
      subject: 'Nachfrage bezüglich Therapieplatz',
      body: `Guten Tag,

ich hatte mich vor einiger Zeit wegen eines Therapieplatzes bei Ihnen gemeldet und wollte höflich nachfragen, ob sich etwas an der Wartelistensituation geändert hat.

Zu meiner Person:
Name: {fullName}{age}
{problems}
{insurance}
Ich bin weiterhin auf der Suche nach einem Therapieplatz und würde mich über eine kurze Rückmeldung freuen.

Vielen Dank für Ihre Zeit.

Mit freundlichen Grüßen
{fullName}`
    },
    {
      id: 'urgent-inquiry',
      name: 'Dringende Terminanfrage',
      subject: 'Dringende Terminanfrage für Psychotherapie',
      body: `Guten Tag,

ich befinde mich derzeit in einer schwierigen Situation und bin dringend auf der Suche nach psychotherapeutischer Unterstützung.

Zu meiner Person:
Name: {fullName}{age}
{problems}
{insurance}
Falls Sie aktuell keine Kapazitäten haben, wäre ich auch für Empfehlungen zu anderen Therapeuten oder Unterstützungsangeboten sehr dankbar.

Vielen Dank für Ihre Unterstützung.

Mit freundlichen Grüßen
{fullName}`
    }
  ]

  const problemOptions = [
    'Angst & Sorgen',
    'Niedergeschlagenheit & Depression',
    'Stress & Burnout',
    'Beziehungsprobleme',
    'Trauma & schwere Erlebnisse',
    'Essstörungen',
    'Zwänge',
    'Persönlichkeitsstörungen',
    'Suchtprobleme',
    'Stressbewältigung',
    'Lebenskrisen',
    'Sonstiges'
  ]

  const generateEmail = (therapistEmail: string, therapistName: string, emailData: EmailData) => {
    const ageText = emailData.age ? `\nAlter: ${emailData.age}` : ''

    let problemsText = ''
    if (emailData.problems.length > 0) {
      if (emailData.problems.length === 1) {
        problemsText = `Meine Themen sind ${emailData.problems[0]}.`
      } else if (emailData.problems.length === 2) {
        problemsText = `Zu meinen Themen gehören ${emailData.problems[0]} und ${emailData.problems[1]}.`
      } else {
        const lastProblem = emailData.problems[emailData.problems.length - 1]
        const otherProblems = emailData.problems.slice(0, -1)
        problemsText = `Meine Themen sind ${otherProblems.join(', ')} und ${lastProblem}.`
      }
    }

    const insuranceText = emailData.insurance 
      ? emailData.insurance === 'bewilligte Kostenerstattung' 
        ? 'Ich habe eine bewilligte Kostenerstattung.'
        : `Ich bin ${emailData.insurance} versichert.`
      : ''

    let body = emailData.template.body
      .replace(/{fullName}/g, emailData.fullName)
      .replace(/{age}/g, ageText)

    if (problemsText) {
      body = body.replace(/{problems}/g, problemsText)
    } else {
      body = body.replace(/{problems}\n/g, '')
    }

    if (insuranceText) {
      body = body.replace(/{insurance}/g, insuranceText)
    } else {
      body = body.replace(/{insurance}\n/g, '')
    }

    const subject = emailData.template.subject

    return {
      to: therapistEmail,
      subject,
      body,
      therapistName
    }
  }

  const createMailtoLink = (therapistEmail: string, therapistName: string, emailData: EmailData) => {
    const email = generateEmail(therapistEmail, therapistName, emailData)
    
    // Manually encode parameters to avoid + encoding for spaces
    const encodedSubject = encodeURIComponent(email.subject)
    const encodedBody = encodeURIComponent(email.body)

    return `mailto:${email.to}?subject=${encodedSubject}&body=${encodedBody}`
  }

  return {
    templates,
    problemOptions,
    generateEmail,
    createMailtoLink
  }
}