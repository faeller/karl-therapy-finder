import { v4 as uuidv4 } from 'uuid'

// Generate a standard UUID
export function generateUUID(): string {
  return uuidv4()
}

// Generate a shorter ID for call IDs
export function generateCallId(): string {
  return uuidv4().replace(/-/g, '').substring(0, 16)
}