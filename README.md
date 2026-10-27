# Before You Buy: Gold Coast address checker

Type in a Gold Coast address and get a plain-English summary of:

1. **Zoning**: what the zone is and what it means for you (plus height, density and minimum lot size where mapped)
2. **Flood risk**: which council flood bands the lot falls in, the chance of a flood over a 30-year mortgage, and the designated flood level compared with the ground level
3. **Other overlays**: bushfire, landslide, airport, road and rail noise, heritage, koala habitat, vegetation, waterways, wetlands, industry buffers and more (33 checked)
4. **Suburb growth history** (see the note on data below)
5. **"Does it really double every 7–10 years?"**: the suburb's doubling time compared with the myth, with a chart

## How to run it

You don't need to install anything. Windows already has everything the app needs.

**Option 1 (recommended):** double-click `start.bat`. A small window opens and your browser goes to http://localhost:8080. Close the black window when you're done.

**Option 2:** double-click `index.html`. It opens straight in your browser and should work the same way.

You need an internet connection, because the app reads live council map data.

## Where the data comes from

| Section | Source | Real or sample? |
|---|---|---|
| Address search | City of Gold Coast `CoGC_Property_Address` layer | **Real, live** |
| Lot boundary | City of Gold Coast `Cadastre_Current_view` | **Real, live** |
| Zoning, height, density, overlays | City of Gold Coast *City Plan Version 11 Open Data* layers | **Real, live** |
| Flood bands (20%, 5%, 1%, 0.2%, 0.05% a year) | City of Gold Coast `Insurance_Flood_Event_2026` | **Real, live** |
| Designated flood level | City of Gold Coast `Designated_Flood_Level_for_Residential_Buildings` | **Real, live** |
| Suburb growth history | `growth-data.js` | **SAMPLE: invented, not real** |

All council layers are public open data (Creative Commons) at
`https://services.arcgis.com/3vStCH7NDoBOZ5zn/arcgis/rest/services`.

**Why is growth sample data?** No free, open source of historical Gold Coast suburb median prices could be connected. The app labels these numbers as invented everywhere they appear. To use real numbers, either:
- open **"Use your own real figures"** in the app and type in two real medians (for example from QGSO, PropTrack, CoreLogic or a realestate.com.au suburb profile), or
- replace the numbers in `growth-data.js` with real ones.

## Limits

- The open-data City Plan layers are **Version 11**. Council may have adopted newer versions since, so always confirm on the official map.
- Overlays are checked against the lot boundary (slightly shrunk so neighbouring lots aren't picked up). Very thin overlays along a boundary might be missed.
- A few council layers can be slow. If one doesn't answer within 30 seconds, the app says it wasn't checked. It never treats a missing answer as "all clear".

**This is not financial, legal or planning advice.** Check the official City of Gold Coast City Plan mapping at https://www.goldcoast.qld.gov.au/Planning-building before you buy.

## Files

- `index.html`: the page
- `app.js`: address lookup, council map queries and the plain-English summary
- `styles.css`: look and feel (works in light and dark mode, and on phones)
- `growth-data.js`: SAMPLE suburb growth numbers
- `serve.ps1` / `start.bat`: tiny local web server (built into Windows PowerShell)
