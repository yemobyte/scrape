# Otakudesu Scraper API

An unofficial REST API for Otakudesu, built with Express.js and Cheerio.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yemobyte/scrape.git
    cd scrape
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the server:**
    ```bash
    node index.js
    ```
    The server will start at `http://localhost:3000`.

## API Endpoints

### 1. Home
Returns the latest anime updates from the homepage.
-   **Method:** `GET`
-   **URL:** `/anime/home`
-   **Response Example:**
    ```json
    {
      "status": true,
      "data": [
        {
          "title": "One Piece",
          "slug": "one-piece-sub-indo",
          "image": "...",
          "episode": "Episode 1089",
          "day": "Minggu",
          "date": "Jan 07, 2024"
        }
      ]
    }
    ```

### 2. Ongoing Anime (Sedang Tayang)
Returns a list of anime currently airing.
-   **Method:** `GET`
-   **URL:** `/anime/ongoing-anime`
-   **Query Parameters:**
    -   `page` (optional): Page number (default: 1)

### 3. Complete Anime (Anime Tamat)
Returns a list of completed anime.
-   **Method:** `GET`
-   **URL:** `/anime/complete-anime`
-   **Query Parameters:**
    -   `page` (optional): Page number (default: 1)

### 4. Schedule (Jadwal Rilis)
Returns the release schedule of anime sorted by day.
-   **Method:** `GET`
-   **URL:** `/anime/schedule`

### 5. Genre List
Returns a list of all available anime genres.
-   **Method:** `GET`
-   **URL:** `/anime/genre`

### 6. Genre Detail
Returns a list of anime belonging to a specific genre.
-   **Method:** `GET`
-   **URL:** `/anime/genre/:slug`
-   **Example:** `/anime/genre/action`

### 7. Search Anime
Search for anime by title.
-   **Method:** `GET`
-   **URL:** `/anime/search/:keyword`
-   **Example:** `/anime/search/naruto`
-   **Response Example:**
    ```json
    {
      "status": true,
      "data": [
        {
          "title": "Boruto: Naruto Next Generations",
          "slug": "borot-sub-indo",
          "image": "...",
          "status": "Ongoing",
          "rating": "6.15",
          "genres": ["Action", "Adventure", "Shounen"]
        }
      ]
    }
    ```

### 8. Anime Detail
Returns detailed information about a specific anime, including synopsis and episode list.
-   **Method:** `GET`
-   **URL:** `/anime/anime/:slug`
-   **Example:** `/anime/anime/borot-sub-indo`

### 9. Episode Detail
Returns download links and a list of stream servers for a specific episode.
-   **Method:** `GET`
-   **URL:** `/anime/episode/:slug`
-   **Example:** `/anime/episode/btr-nng-episode-293-sub-indo`
-   **Response Example:**
    ```json
    {
      "status": true,
      "data": {
        "title": "Boruto: Naruto Next Generations Episode 293",
        "stream_url": "...",
        "servers": [
          { "name": "odstream", "serverId": "138366-0-360p" }
        ],
        "downloads": [ ... ]
      }
    }
    ```

### 10. Stream URL
Returns the actual embed URL and quality for a specific server ID. This is scraped effectively bypassing protections.
-   **Method:** `GET`
-   **URL:** `/anime/server/:serverId`
-   **Example:** `/anime/server/138366-0-360p`
-   **Response Example:**
    ```json
    {
      "status": true,
      "data": {
        "url": "https://desustream.info/dstream/arcg/?id=...",
        "quality": "360p"
      }
    }
    ```

### 11. Batch Download
Returns batch download links if available for the anime.
-   **Method:** `GET`
-   **URL:** `/anime/batch/:slug`
-   **Example:** `/anime/batch/btr-nng-batch-sub-indo`