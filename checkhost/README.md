# CheckHost Scraper

Scraper for [check-host.net](https://check-host.net) using Puppeteer.

## Usage
`GET /checkhost?domain=example.com&type=http`

**Types:**
- `http`
- `ping`
- `tcp-port`
- `udp-port`
- `dns`
- `info`

## Response
Returns a list of check results from various global nodes including location, ISP, and result status/time.
