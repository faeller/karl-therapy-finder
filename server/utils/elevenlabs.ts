import type { H3Event } from 'h3'

export interface ElevenLabsConfig {
  apiKey: string
  baseUrl?: string
}

export interface Conversation {
  agent_id: string
  conversation_id: string
  start_time_unix_secs: number
  call_duration_secs: number
  message_count: number
  status: 'initiated' | 'in-progress' | 'processing' | 'done' | 'failed'
  call_successful: 'success' | 'failure' | 'unknown'
  agent_name: string
}

export interface ConversationDetails extends Conversation {
  transcript: Array<{
    role: 'user' | 'agent'
    time_in_call_secs: number
    message: string
  }>
  metadata: {
    start_time_unix_secs: number
    call_duration_secs: number
  }
  has_audio: boolean
  has_user_audio: boolean
  has_response_audio: boolean
}

export interface BatchCall {
  id: string
  phone_number_id: string
  name: string
  agent_id: string
  created_at_unix: number
  scheduled_time_unix: number | null
  total_calls_dispatched: number
  total_calls_scheduled: number
  last_updated_at_unix: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  agent_name: string
  phone_provider: 'twilio' | 'sip_trunk'
}

export interface Agent {
  agent_id: string
  name: string
  prompt?: string
  language?: string
  voice_id?: string
  conversation_config?: any
}

export interface BatchCallRequest {
  call_name: string
  agent_id: string
  agent_phone_number_id: string
  scheduled_time_unix?: number
  recipients: Array<{ phone_number: string }>
}

export interface OutboundCallRequest {
  agent_id: string
  agent_phone_number_id: string
  to_number: string
  conversation_initiation_client_data?: object | null
}

export interface OutboundCallResponse {
  success: boolean
  message: string
  conversation_id: string | null
  callSid: string | null
}

export interface OutboundCall {
  id: string
  agent_id: string
  agent_phone_number_id: string
  to_number: string
  conversation_id: string | null
  call_sid: string | null
  status: 'initiated' | 'in-progress' | 'completed' | 'failed' | 'cancelled'
  created_at: number
  started_at?: number
  completed_at?: number
  error_message?: string
  agent_name?: string
}

export class ElevenLabsError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ElevenLabsError'
  }
}

export class ElevenLabsClient {
  private config: ElevenLabsConfig
  private baseUrl: string

  constructor(config: ElevenLabsConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://api.elevenlabs.io'
  }

  async request<T>(
    endpoint: string,
    options: {
      method?: string
      body?: any
      params?: Record<string, any>
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params } = options
    
    let url = `${this.baseUrl}${endpoint}`
    
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`
      }
    }

    const headers: Record<string, string> = {
      'xi-api-key': this.config.apiKey,
      'Content-Type': 'application/json'
    }

    const requestBody = body ? JSON.stringify(body) : undefined
    
    // Debug logging for batch calls
    if (endpoint.includes('batch-calling')) {
      console.log('=== ELEVENLABS CLIENT REQUEST ===')
      console.log('Method:', method)
      console.log('URL:', url)
      console.log('Headers:', headers)
      console.log('Body:', requestBody)
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: requestBody
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (endpoint.includes('batch-calling')) {
          console.log('=== ELEVENLABS CLIENT ERROR ===')
          console.log('Status:', response.status)
          console.log('Status Text:', response.statusText)
          console.log('Error Data:', JSON.stringify(errorData, null, 2))
          
          // Log detailed validation errors
          if (errorData.detail && Array.isArray(errorData.detail)) {
            errorData.detail.forEach((error: any, index: number) => {
              console.log(`Validation Error ${index + 1}:`)
              console.log('  Type:', error.type)
              console.log('  Location:', error.loc)
              console.log('  Message:', error.msg)
              console.log('  Input:', error.input)
            })
          }
        }
        
        throw new ElevenLabsError(
          `ElevenLabs API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        )
      }

      const data = await response.json()
      
      if (endpoint.includes('batch-calling')) {
        console.log('=== ELEVENLABS CLIENT SUCCESS ===')
        console.log('Response:', JSON.stringify(data, null, 2))
      }
      
      return data as T
    } catch (error) {
      if (error instanceof ElevenLabsError) {
        throw error
      }
      throw new ElevenLabsError(`Network error: ${error}`)
    }
  }

  // Conversations
  async listConversations(params?: {
    cursor?: string
    agent_id?: string
    call_successful?: 'success' | 'failure' | 'unknown'
    call_start_before_unix?: number
    call_start_after_unix?: number
    page_size?: number
  }) {
    return this.request<{
      conversations: Conversation[]
      has_more: boolean
      next_cursor: string | null
    }>('/v1/convai/conversations', { params })
  }

  async getConversation(conversationId: string) {
    return this.request<ConversationDetails>(`/v1/convai/conversations/${conversationId}`)
  }

  async deleteConversation(conversationId: string) {
    return this.request(`/v1/convai/conversations/${conversationId}`, {
      method: 'DELETE'
    })
  }

  async getConversationAudio(conversationId: string): Promise<ArrayBuffer> {
    const url = `${this.baseUrl}/v1/convai/conversations/${conversationId}/audio`
    
    const response = await fetch(url, {
      headers: {
        'xi-api-key': this.config.apiKey
      }
    })

    if (!response.ok) {
      throw new ElevenLabsError(`Failed to fetch audio: ${response.status}`)
    }

    return response.arrayBuffer()
  }

  // Agents
  async listAgents() {
    return this.request<{ agents: Agent[] }>('/v1/convai/agents')
  }

  async getAgent(agentId: string) {
    return this.request<Agent>(`/v1/convai/agents/${agentId}`)
  }

  async createAgent(agent: Omit<Agent, 'agent_id'>) {
    return this.request<Agent>('/v1/convai/agents', {
      method: 'POST',
      body: agent
    })
  }

  async updateAgent(agentId: string, updates: Partial<Agent>) {
    return this.request<Agent>(`/v1/convai/agents/${agentId}`, {
      method: 'PATCH',
      body: updates
    })
  }

  async deleteAgent(agentId: string) {
    return this.request(`/v1/convai/agents/${agentId}`, {
      method: 'DELETE'
    })
  }

  async duplicateAgent(agentId: string) {
    return this.request<Agent>(`/v1/convai/agents/${agentId}/duplicate`, {
      method: 'POST'
    })
  }

  // Batch Calling
  async submitBatchCall(request: BatchCallRequest) {
    return this.request<BatchCall>('/v1/convai/batch-calling/submit', {
      method: 'POST',
      body: request
    })
  }

  async listBatchCalls() {
    return this.request<{ batch_calls: BatchCall[] }>('/v1/convai/batch-calling/workspace')
  }

  async getBatchCall(batchId: string) {
    return this.request<BatchCall>(`/v1/convai/batch-calling/${batchId}`)
  }

  async cancelBatchCall(batchId: string) {
    return this.request(`/v1/convai/batch-calling/${batchId}/cancel`, {
      method: 'POST'
    })
  }

  async retryBatchCall(batchId: string) {
    return this.request(`/v1/convai/batch-calling/${batchId}/retry`, {
      method: 'POST'
    })
  }

  // Twilio Outbound Calls
  async makeOutboundCall(request: OutboundCallRequest): Promise<OutboundCallResponse> {
    return this.request<OutboundCallResponse>('/v1/convai/twilio/outbound-call', {
      method: 'POST',
      body: request
    })
  }
}

// Factory function to create ElevenLabs client with KV-stored API key
export async function createElevenLabsClient(event: H3Event): Promise<ElevenLabsClient> {
  const kv = hubKV()
  const apiKey = await kv.getItem('elevenlabs_api_key')
  
  if (!apiKey) {
    throw new ElevenLabsError('ElevenLabs API key not configured in admin settings')
  }

  return new ElevenLabsClient({ apiKey })
}

// Webhook HMAC validation
export async function validateWebhookSignature(
  event: H3Event,
  body: string
): Promise<boolean> {
  const signature = getHeader(event, 'elevenlabs-signature')
  if (!signature) {
    return false
  }

  const kv = hubKV()
  const webhookSecret = await kv.getItem('elevenlabs_webhook_secret')
  if (!webhookSecret) {
    return false
  }

  const crypto = await import('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  return signature === expectedSignature
}