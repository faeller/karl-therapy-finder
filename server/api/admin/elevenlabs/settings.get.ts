export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  const kv = hubKV()
  
  const [apiKey, webhookSecret, phoneNumberId] = await Promise.all([
    kv.getItem('elevenlabs_api_key'),
    kv.getItem('elevenlabs_webhook_secret'),
    kv.getItem('elevenlabs_phone_number_id')
  ])

  return {
    hasApiKey: !!apiKey,
    hasWebhookSecret: !!webhookSecret,
    hasPhoneNumberId: !!phoneNumberId,
    apiKeyPreview: apiKey ? `${apiKey.slice(0, 8)}...` : null,
    phoneNumberId: phoneNumberId || null
  }
})