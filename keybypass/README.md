# KeyBypass Unofficial API

A Node.js scraper for keybypass.net to automatically bypass link shorteners and key systems.

## Prerequisites
- Node.js installed
- axios and express installed

## Installation
```bash
npm install express axios cors
```

## Running the API
```bash
node index.js
```

## Endpoints

### 1. Root
- **Method:** `GET`
- **Path:** `/`
- **Description:** Get API usage information.

### 2. Bypass
- **Method:** `POST`
- **Path:** `/bypass`
- **Body:**
  ```json
  {
    "url": "TARGET_URL_HERE",
    "hcaptcha_token": "HCAPTCHA_TOKEN_HERE"
  }
  ```
- **Description:** Submit a URL to be bypassed. Note: You must provide a valid hCaptcha token generated for the sitekey `a32c1138-88bc-4f6a-b466-a622acba2376`.

## Notes
- `keybypass.net` uses hCaptcha for bot protection.
- To use this API programmatically, you'll need to integrate an hCaptcha solving service (like 2Captcha, CapMonster, or similar) to obtain a token for the specified sitekey.
