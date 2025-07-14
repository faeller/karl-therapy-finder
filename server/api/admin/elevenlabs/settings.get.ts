export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  const kv = hubKV()
  
  const [apiKey, webhookSecret] = await Promise.all([
    kv.getItem('elevenlabs_api_key'),
    kv.getItem('elevenlabs_webhook_secret')
  ])

  return {
    hasApiKey: !!apiKey,
    hasWebhookSecret: !!webhookSecret,
    apiKeyPreview: apiKey ? `${apiKey.slice(0, 8)}...` : null
  }
})