# Bimas Islam Scraper

A Node.js scraper for Bimas Islam (Kemenag) to extract prayer and Imsakiyah schedules.

## Usage

```bash
npm start
```

## Endpoints

### 1. Jazwal Shalat (Prayer Schedule)
Fetches the monthly prayer schedule for a specific province and city.

- **URL:** `/api/jadwalshalat`
- **Method:** `GET`
- **Query Params:**
  - `provinsi` (Optional): Province name (e.g., "DKI JAKARTA", "ACEH"). Default: "DKI JAKARTA".
  - `kabkota` (Optional): City/Regency name (e.g., "KOTA JAKARTA", "KAB. ACEH BARAT"). Default: "KOTA JAKARTA".
  - `bulan` (Optional): Month index (1-12). Default: Current month.
  - `tahun` (Optional): Year (e.g., 2025). Default: Current year.

- **Success Response:**
  ```json
  {
    "status": true,
    "creator": "yemobyte",
    "data": {
      "01": {
        "tanggal": "2025-01-01",
        "imsak": "04:15",
        "subuh": "04:25",
        "terbit": "05:43",
        "dhuha": "06:12",
        "dzuhur": "12:02",
        "ashar": "15:28",
        "maghrib": "18:16",
        "isya": "19:31"
      }
      // ...
    }
  }
  ```

### 2. Jadwal Imsakiyah
Fetches the Imsakiyah schedule for the whole Ramadan month of a specific year.

- **URL:** `/api/jadwalimsakiyah`
- **Method:** `GET`
- **Query Params:**
  - `provinsi` (Optional): Province name. Default: "DKI JAKARTA".
  - `kabkota` (Optional): City/Regency name. Default: "KOTA JAKARTA".
  - `tahun` (Optional): Year. Default: Current year.

- **Success Response:**
  ```json
  {
    "status": true,
    "creator": "yemobyte",
    "data": {
      "1": {
        "tanggal": 1,
        "imsak": "04:33",
        "subuh": "04:43",
        // ...
      }
      // ...
    }
  }
  ```

## Examples

**1. Custom City & Province**
Format: `provinsi=[NAME]&kabkota=[NAME]`

- **Bandung, Jawa Barat:**
  `/api/jadwalshalat?provinsi=JAWA BARAT&kabkota=KOTA BANDUNG`
- **Surabaya, Jawa Timur:**
  `/api/jadwalshalat?provinsi=JAWA TIMUR&kabkota=KOTA SURABAYA`
- **Aceh Barat, Aceh:**
  `/api/jadwalshalat?provinsi=ACEH&kabkota=KAB. ACEH BARAT`

**2. Custom Year (Imsakiyah)**
Format: `tahun=[YEAR]`

- **Jakarta (2026):**
  `/api/jadwalimsakiyah?provinsi=DKI JAKARTA&kabkota=KOTA JAKARTA&tahun=2026`

> **Note:** Province and City names are case-insensitive. Ensure names match those on the [Bimas Islam website](https://bimasislam.kemenag.go.id/jadwalshalat).
