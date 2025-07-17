# Cloudflare KV Setup for Patreon OAuth

This document explains how to set up Cloudflare KV for secure token storage.

## Prerequisites

- Cloudflare account
- Wrangler CLI installed
- NuxtHub configured

## Setup Steps

### 1. Install Wrangler CLI (if not already installed)
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Create KV Namespace
```bash
npx wrangler kv namespace create KARL_KV
```

This will output something like:
```
{ binding = "KARL_KV", id = "your-namespace-id-here" }
```

### 4. Add to Environment Variables

Add to your `.env` file:
```bash
# Cloudflare KV Configuration
NUXT_HUB_KV=true
CLOUDFLARE_KV_NAMESPACE_ID=your-namespace-id-here
```

### 5. Configure wrangler.toml (if needed)

If you're deploying with Wrangler, add to `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "KARL_KV"
id = "your-namespace-id-here"
```

## For Development

NuxtHub will automatically create a local KV store in `.data/hub` for development.

## For Production

Make sure to set the environment variables in your Cloudflare Pages/Workers environment:
- `NUXT_HUB_KV=true`
- `CLOUDFLARE_KV_NAMESPACE_ID=your-namespace-id-here`

## Verification

You can verify KV is working by checking the debug page at `/debug` and connecting to Patreon. The session should be stored in KV with a 30-minute expiry.

## KV Usage in the App

The Patreon OAuth implementation uses KV to store:
- Session tokens (30-minute TTL) stored in HttpOnly cookies
- Session metadata (creation time, expiry)
- User authentication state

Keys are formatted as: `patreon_session:{uuid}`

## Cleanup

KV entries automatically expire after 30 minutes. Manual cleanup can be done via:
```bash
wrangler kv:key delete --binding KARL_KV "patreon_session:session-id"
```