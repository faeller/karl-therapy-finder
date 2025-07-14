# ElevenLabs Conversational AI API Documentation

## Overview
ElevenLabs Conversational AI platform for deploying customized voice agents with speech-to-text, language models, text-to-speech, and turn-taking capabilities.

**Base URL**: `https://api.elevenlabs.io`
**Authentication**: Header `xi-api-key: YOUR_API_KEY`

## API Key Management (KV Storage)
Store ElevenLabs API key securely in Cloudflare KV:
- **Key**: `elevenlabs_api_key`
- **Admin setting**: Configurable through admin panel
- **Security**: Admin-only access, never expose client-side

## Core Endpoints

### Conversations
#### List Conversations
```
GET /v1/convai/conversations
```
**Query Parameters**:
- `cursor`: string | null - Pagination cursor
- `agent_id`: string | null - Filter by agent
- `call_successful`: enum - success|failure|unknown
- `call_start_before_unix`: integer - Filter before timestamp
- `call_start_after_unix`: integer - Filter after timestamp
- `page_size`: integer (1-100, default 30)

**Response**:
```json
{
  "conversations": [
    {
      "agent_id": "string",
      "conversation_id": "string", 
      "start_time_unix_secs": 42,
      "call_duration_secs": 42,
      "message_count": 42,
      "status": "initiated|in-progress|processing|done|failed",
      "call_successful": "success|failure|unknown",
      "agent_name": "string"
    }
  ],
  "has_more": true,
  "next_cursor": "string"
}
```

#### Get Conversation Details
```
GET /v1/convai/conversations/{conversation_id}
```
**Response**:
```json
{
  "agent_id": "string",
  "conversation_id": "string",
  "status": "initiated|in-progress|processing|done|failed",
  "transcript": [
    {
      "role": "user|agent",
      "time_in_call_secs": 0,
      "message": "string"
    }
  ],
  "metadata": {
    "start_time_unix_secs": 0,
    "call_duration_secs": 0
  },
  "has_audio": true,
  "has_user_audio": true,
  "has_response_audio": true
}
```

#### Delete Conversation
```
DELETE /v1/convai/conversations/{conversation_id}
```

#### Get Conversation Audio
```
GET /v1/convai/conversations/{conversation_id}/audio
```

### Agents
#### List Agents
```
GET /v1/convai/agents
```

#### Create Agent
```
POST /v1/convai/agents
```

#### Get Agent
```
GET /v1/convai/agents/{agent_id}
```

#### Update Agent
```
PATCH /v1/convai/agents/{agent_id}
```

#### Delete Agent
```
DELETE /v1/convai/agents/{agent_id}
```

#### Duplicate Agent
```
POST /v1/convai/agents/{agent_id}/duplicate
```

### Batch Calling
#### Submit Batch Call
```
POST /v1/convai/batch-calling/submit
```
**Request**:
```json
{
  "call_name": "string",
  "agent_id": "string",
  "agent_phone_number_id": "string", 
  "scheduled_time_unix": 0,
  "recipients": [
    {"phone_number": "string"}
  ]
}
```

**Response**:
```json
{
  "id": "string",
  "phone_number_id": "string",
  "name": "string",
  "agent_id": "string", 
  "created_at_unix": 0,
  "scheduled_time_unix": 0,
  "total_calls_dispatched": 0,
  "total_calls_scheduled": 0,
  "last_updated_at_unix": 0,
  "status": "pending|in_progress|completed|failed|cancelled",
  "agent_name": "string",
  "phone_provider": "twilio|sip_trunk"
}
```

#### List Batch Calls
```
GET /v1/convai/batch-calling
```

#### Get Batch Call Details
```
GET /v1/convai/batch-calling/{batch_id}
```

#### Cancel Batch Call
```
POST /v1/convai/batch-calling/{batch_id}/cancel
```

#### Retry Batch Call
```
POST /v1/convai/batch-calling/{batch_id}/retry
```

### Twilio Integration
#### Outbound Call via Twilio
```
POST /v1/convai/twilio/outbound-call
```

## Webhooks

### Configuration
- **Post-call Transcription**: `post_call_transcription`
- **Post-call Audio**: `post_call_audio`
- **Security**: HMAC signature validation via `ElevenLabs-Signature` header
- **IP Whitelist**: 
  - US: 34.67.146.145, 34.59.11.47
  - EU: 35.204.38.71, 34.147.113.54

### Webhook Payload (Transcription)
```json
{
  "agent_id": "string",
  "conversation_id": "string",
  "transcript": [...],
  "metadata": {...},
  "analysis": {...}
}
```

### Webhook Payload (Audio)
```json
{
  "agent_id": "string", 
  "conversation_id": "string",
  "audio_base64": "string"
}
```

## Rate Limits & Pricing

### Concurrency Limits by Plan
- Free: 4 concurrent calls
- Starter: 6 concurrent calls  
- Creator: 10 concurrent calls
- Pro: 20 concurrent calls
- Scale: 30 concurrent calls
- Business: 30 concurrent calls

### Pricing
- Business Plan: $0.08/minute (includes 13,750 minutes)
- Setup & Testing: 50% cost reduction

## Technical Notes

### Audio Formats
- **PCM**: 8/16/22.05/24/44.1 kHz
- **μ-law**: 8000Hz (required for telephony)

### Security
- SOC2, GDPR compliance
- End-to-end encryption
- API key scope restriction

### Error Handling
- Monitor `current-concurrent-requests` header
- Implement retry logic for failed calls
- Handle webhook failures (auto-disabled after 10 failures)

### Twilio Outbound Calls
#### Make Outbound Call
```
POST /v1/convai/twilio/outbound-call
```
**Request**:
```json
{
  "agent_id": "string",
  "agent_phone_number_id": "string",
  "to_number": "string",
  "conversation_initiation_client_data": {}
}
```
**Response**:
```json
{
  "success": true,
  "message": "string",
  "conversation_id": "string",
  "callSid": "string"
}
```

## KV Storage Schema

### Settings
- `elevenlabs_api_key`: API key for authentication
- `elevenlabs_webhook_secret`: HMAC secret for webhook validation

### Data Storage
- `elevenlabs_conversations:{conversation_id}`: Conversation details
- `elevenlabs_batch_calls:{batch_id}`: Batch call information
- `elevenlabs_agents:{agent_id}`: Agent configurations
- `elevenlabs_webhooks:{timestamp}`: Webhook payload logs
- `elevenlabs_outbound_call:{call_id}`: Individual outbound call details
- `elevenlabs_outbound_calls_list`: List of recent outbound call IDs