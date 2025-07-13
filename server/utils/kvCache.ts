interface CacheEntry<T = any> {
  data: T
  expires: number
}

/**
 * KV-based cache utility for server-side caching
 * Replaces in-memory Map cache with persistent Cloudflare KV storage
 * Falls back to in-memory cache for local development
 */
export class KVCache {
  private storage: any
  private keyPrefix: string
  private fallbackCache = new Map<string, { data: any; expires: number }>()
  private isKvAvailable: boolean | null = null
  
  constructor(keyPrefix: string = 'cache') {
    this.keyPrefix = keyPrefix
  }
  
  /**
   * Lazy initialize KV storage when first needed
   */
  private getStorage() {
    if (this.isKvAvailable === null) {
      try {
        this.storage = hubKV()
        this.isKvAvailable = true
        console.log(`✅ KV Cache initialized: ${this.keyPrefix}`)
      } catch (error) {
        this.isKvAvailable = false
        console.warn(`⚠️ KV not available for ${this.keyPrefix}, using fallback memory cache`)
      }
    }
    return this.storage
  }
  
  /**
   * Get cached data by key
   */
  async get<T = any>(key: string): Promise<T | null> {
    const cacheKey = `${this.keyPrefix}:${key}`
    
    // Lazy initialize storage
    this.getStorage()
    
    if (!this.isKvAvailable) {
      // Use fallback memory cache
      const cached = this.fallbackCache.get(cacheKey)
      if (!cached || Date.now() > cached.expires) {
        this.fallbackCache.delete(cacheKey)
        return null
      }
      return cached.data
    }
    
    try {
      const cached = await this.storage.getItem<CacheEntry<T> | string>(cacheKey)
      
      if (!cached) {
        return null
      }
      
      // Handle both string and object responses from KV
      const entry: CacheEntry<T> = typeof cached === 'string' 
        ? JSON.parse(cached) 
        : cached
      
      // Check if expired
      if (Date.now() > entry.expires) {
        // Clean up expired entry
        await this.storage.removeItem(cacheKey)
        return null
      }
      
      return entry.data
    } catch (error) {
      console.error('KV Cache get error:', error)
      return null
    }
  }
  
  /**
   * Set cached data with TTL
   */
  async set<T = any>(key: string, data: T, ttlMs: number): Promise<void> {
    const cacheKey = `${this.keyPrefix}:${key}`
    const entry: CacheEntry<T> = {
      data,
      expires: Date.now() + ttlMs
    }
    
    // Lazy initialize storage
    this.getStorage()
    
    if (!this.isKvAvailable) {
      // Use fallback memory cache
      this.fallbackCache.set(cacheKey, entry)
      return
    }
    
    try {
      // Store with KV TTL for automatic cleanup
      const ttlSeconds = Math.ceil(ttlMs / 1000)
      await this.storage.setItem(cacheKey, JSON.stringify(entry), {
        ttl: ttlSeconds
      })
    } catch (error) {
      console.error('KV Cache set error:', error)
      // Fallback to memory cache if KV fails
      this.fallbackCache.set(cacheKey, entry)
    }
  }
  
  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key)
    return data !== null
  }
  
  /**
   * Delete cached entry
   */
  async delete(key: string): Promise<void> {
    const cacheKey = `${this.keyPrefix}:${key}`
    
    // Lazy initialize storage
    this.getStorage()
    
    if (!this.isKvAvailable) {
      this.fallbackCache.delete(cacheKey)
      return
    }
    
    try {
      await this.storage.removeItem(cacheKey)
    } catch (error) {
      console.error('KV Cache delete error:', error)
      // Also remove from fallback cache
      this.fallbackCache.delete(cacheKey)
    }
  }
  
  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T = any>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttlMs: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }
    
    // Cache miss - execute function and cache result
    const data = await fetchFn()
    await this.set(key, data, ttlMs)
    return data
  }
}

/**
 * Default cache instances for different use cases
 */
export const therapistCache = new KVCache('therapist')
export const eteminCache = new KVCache('etermin')
export const generalCache = new KVCache('general')

/**
 * Legacy compatibility function that mimics the old Map cache interface
 * @deprecated Use KVCache instances instead
 */
export function createLegacyCache() {
  const kvCache = new KVCache('legacy')
  
  return {
    async get(key: string) {
      const data = await kvCache.get(key)
      return data ? { data, expires: Date.now() + 120 * 60 * 1000 } : undefined
    },
    
    async set(key: string, value: { data: any; expires: number }) {
      const ttl = value.expires - Date.now()
      if (ttl > 0) {
        await kvCache.set(key, value.data, ttl)
      }
    },
    
    async has(key: string) {
      return await kvCache.has(key)
    },
    
    async delete(key: string) {
      await kvCache.delete(key)
    }
  }
}