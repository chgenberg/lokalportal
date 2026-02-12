# Gratis API:er relevanta för HittaYta

## I bruk

- **Nominatim** (OpenStreetMap) – Geokodning av adresser
- **Overpass API** (OpenStreetMap) – Närliggande faciliteter (restauranger, butiker, buss, tåg, skolor, vård)
- **SCB** (Statistiska centralbyrån) – Befolkningsdata per kommun
- **Egna annonser** – Prisjämförelse från databasen

## Ytterligare gratis API:er att överväga

### SCB Geodata / Rutsättningsstatistik
- **Länk:** https://www.scb.se/en/services/open-data-api/open-geodata/
- **Innehåll:** Befolkningsdata i 1×1 km-rutor, ålder, kön
- **Användning:** Mer precisionsrik områdesanalys (t.ex. "cirka X invånare inom 1 km")
- **Licens:** CC0 (öppen användning)

### Lantmäteriet – Fastighetsprisregistret
- **Länk:** https://www.lantmateriet.se/sv/Kartor-och-geografisk-information/geodatatjanster/oppna-data/
- **Innehåll:** Köpeskillingar, försäljningsdatum, fastighetstyper (från 2014)
- **Användning:** Faktiska prisnivåer i området för marknadsjämförelser
- **Access:** Via Geodataportalen (geodata.se) eller API via Lantmäteriet

### Trafikverket – Kollektivtrafik
- **Länk:** https://www.trafikverket.se/trafikinformation/trafikdata/
- **Innehåll:** Hållplatser, linjer, restider
- **Användning:** Avstånd till närmaste buss/tåg, linjeinfo
- **OBS:** Kräver registrering för API-nyckel

### Google Places API (ej gratis)
- Omfattande POI-data men kostnad per anrop
- Kan användas som reserv när Overpass ger dåligt resultat
