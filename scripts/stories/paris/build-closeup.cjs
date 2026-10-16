// node build-closeup.cjs <stations.json> <streets.json> <out.json>
// The snapshot around Choiseul – Quatre Septembre, the station in the
// article's Locate Control screenshot: streets, stations, a 250 m circle.
const fs = require("fs")
const [stationsPath, streetsPath, out] = process.argv.slice(2)
const stations = JSON.parse(fs.readFileSync(stationsPath, "utf8"))
const streets = JSON.parse(fs.readFileSync(streetsPath, "utf8"))
const centre = stations.find(s => s.name === "Choiseul - Quatre Septembre")
const [lon0, lat0] = [centre.coordonnees_geo.lon, centre.coordonnees_geo.lat]
const k = Math.cos((lat0 * Math.PI) / 180)
const M = 111320 // metres per degree of latitude
const W = 640, H = 520, half = 560 // metres from the centre to the left edge
const scale = W / 2 / half // px per metre
const P = ([lon, lat]) => [+(W / 2 + (lon - lon0) * k * M * scale).toFixed(1), +(H / 2 - (lat - lat0) * M * scale).toFixed(1)]
const inBox = ([x, y], m = 0) => x >= -m && x <= W + m && y >= -m && y <= H + m
const thin = (pts, min) => pts.filter((p, i) => i === 0 || i === pts.length - 1 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) >= min)
const major = new Set(["primary", "secondary", "trunk", "tertiary"])
const ways = streets.elements
  .map(e => ({ name: e.tags.name || "", major: major.has(e.tags.highway), pts: thin(e.geometry.map(g => P([g.lon, g.lat])), 0.8) }))
  .filter(w => w.pts.some(p => inBox(p, 40)))
  .map(w => ({ name: w.name, major: w.major, d: "M" + w.pts.map(p => p.join(",")).join("L") }))
const near = stations
  .filter(s => s.is_installed === "OUI" && s.coordonnees_geo)
  .map(s => ({ s, p: P([s.coordonnees_geo.lon, s.coordonnees_geo.lat]) }))
  .filter(({ p }) => inBox(p, -6))
  .map(({ s, p }) => ({ name: s.name, x: p[0], y: p[1], mechanical: s.mechanical, ebike: s.ebike, docks: s.numdocksavailable, here: s === centre }))
fs.writeFileSync(out, JSON.stringify({ width: W, height: H, radius: +(250 * scale).toFixed(1), metre: scale, ways, stations: near }))
console.log({ ways: ways.length, stations: near.length, bytes: fs.statSync(out).size, names: [...new Set(ways.filter(w => w.major).map(w => w.name))].slice(0, 12) })
