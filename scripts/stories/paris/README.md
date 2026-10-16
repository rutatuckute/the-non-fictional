# Random Parisian rides — the station map

Both figures are drawn from one snapshot, taken on 16 October 2026 at 14:53
(Paris time), and kept in `src/components/stories/paris/`:

- `map.json`: every Vélib' station, with its mechanical bikes, e-bikes and free
  docks, projected onto a 1000-wide plane with the 20 arrondissements and the
  Seine and Marne. It is made by `build-map.cjs`. Stations that aren't installed,
  or that hadn't reported for two days before the snapshot, are left out.
- `closeup.json`: the streets and stations about 560 m around Choiseul – Quatre
  Septembre. It is made by `build-closeup.cjs`.

The sources:

- Stations: Paris Open Data, `velib-disponibilite-en-temps-reel`
  (https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/exports/json)
- Arrondissements: Paris Open Data, `arrondissements` (GeoJSON export)
- Rivers and streets: OpenStreetMap via Overpass. Rivers are
  `way["waterway"="river"]["name"~"La Seine|La Marne"]`. Streets are the major and
  residential `highway` ways in (48.8645, 2.3275, 48.8755, 2.3445).

To rebuild:

    node build-map.cjs stations.json arrondissements.geojson rivers.json map.json
    node build-closeup.cjs stations.json streets.json closeup.json

After rebuilding `map.json`, set its `label` to the snapshot's time. The figure shows
it as written, so the server and the browser render the same text.
