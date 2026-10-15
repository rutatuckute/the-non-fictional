# Projects the OSM streets, the Miljacka, the places and the walk onto one
# plane (equirectangular, scaled for 43.85°N — exact enough for a city), and
# simplifies the lines so the map stays light. Writes map.json.
import json, math
LON0, LON1, LAT0, LAT1 = 18.383, 18.452, 43.832, 43.868
K = math.cos(math.radians((LAT0 + LAT1) / 2))
W = 1400
H = round(W * (LAT1 - LAT0) / ((LON1 - LON0) * K))
def xy(lon, lat):
    return ((lon - LON0) / (LON1 - LON0) * W, (LAT1 - lat) / (LAT1 - LAT0) * H)

def simplify(pts, tol):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    n = math.hypot(dx, dy) or 1e-9
    i, dmax = 0, -1
    for k in range(1, len(pts) - 1):
        d = abs(dy * pts[k][0] - dx * pts[k][1] + x2 * y1 - y2 * x1) / n
        if d > dmax: i, dmax = k, d
    if dmax <= tol: return [pts[0], pts[-1]]
    return simplify(pts[:i + 1], tol)[:-1] + simplify(pts[i:], tol)

def path(pts):
    return "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts)

MAJOR = {"motorway", "trunk", "primary", "secondary", "motorway_link", "trunk_link", "primary_link", "secondary_link"}
MID = {"tertiary", "tertiary_link", "unclassified", "residential", "living_street", "pedestrian"}
MINOR = {"footway", "steps", "path", "cycleway"}
groups = {"major": [], "mid": [], "minor": []}
river = []
for el in json.load(open("osm.json"))["elements"]:
    g, t = el.get("geometry"), el.get("tags", {})
    if not g: continue
    pts = simplify([xy(p["lon"], p["lat"]) for p in g], 0.7)
    if t.get("waterway") == "river": river.append(path(pts)); continue
    h = t.get("highway")
    key = "major" if h in MAJOR else "mid" if h in MID else "minor" if h in MINOR else None
    if key: groups[key].append(path(pts))

places = []
for p in json.load(open("places.json")):
    x, y = xy(p["lon"], p["lat"])
    places.append({k: p[k] for k in ("key", "name", "kind")} | {"x": round(x, 1), "y": round(y, 1), "approx": p.get("approx", False)})

walk = []
for leg in json.load(open("walk.json")):
    pts = simplify([xy(lon, lat) for lon, lat in leg["coords"]], 0.4)
    walk.append({"from": leg["from"], "to": leg["to"], "metres": leg.get("metres"), "minutes": leg.get("minutes"), "d": path(pts)})

out = {"w": W, "h": H, "roads": {k: "".join(v) for k, v in groups.items()}, "river": "".join(river), "places": places, "walk": walk}
json.dump(out, open("map.json", "w"), ensure_ascii=False)
print(W, H, {k: len(v) for k, v in groups.items()}, "bytes", len(json.dumps(out)))
