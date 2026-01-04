---
title: Turnstile Solver
emoji: 🛡️
colorFrom: blue
colorTo: cyan
sdk: docker
pinned: false
app_port: 7860
---

# Turnstile Solver API

A powerful Cloudflare Turnstile solver using **Puppeteer Real Browser**.
Created by **Yemobyte**.

## Features
- **Auto-Solve**: Uses advanced browser automation to pass Turnstile checks.
- **Token Extraction**: Returns the `cf-turnstile-response` token.
- **Simple API**: Easy to use GET/POST endpoints.

## Endpoints

### Solve Turnstile
`GET /turnstile?url=https://target-site.com`
`POST /turnstile` (Body: `{ "url": "..." }`)

**Response:**
```json
{
  "status": true,
  "author": "Yemobyte",
  "data": {
    "token": "0.xxxxxxx...",
    "cf_clearance": "xxxx",
    "user_agent": "Mozilla...",
    "cookies": []
  }
}
```

## Setup
1. `npm install`
2. `node index.js`
