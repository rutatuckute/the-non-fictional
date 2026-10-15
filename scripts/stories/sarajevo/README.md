# Sarajevo walk — map data

The data behind `src/components/stories/sarajevo/map.json`, all from OpenStreetMap
(© OpenStreetMap contributors, ODbL).

- `osm.json` (not kept; ~5 MB): streets and the Miljacka from Overpass, bbox
  43.832–43.868 N, 18.383–18.452 E:
  `[out:json];(way["highway"](43.832,18.383,43.868,18.452);way["waterway"="river"](…););out geom;`
- `geocode.py` → `places.json`: the 22 places, looked up on Nominatim. Divan Saraj and
  Miris Dunja are not on OSM; their positions are approximate (`approx: true`). The
  assassination corner uses the coordinates the article gives.
- `walk.json`: foot routes between the five sights (routing.openstreetmap.de).
- `build-map.py` projects and simplifies all of it into `map.json`:
  `python3 build-map.py` with `osm.json`, `places.json` and `walk.json` beside it.
