// node build-map.cjs <stations.json> <arr.geojson> <rivers.json> <out.json>
// One snapshot of Vélib' availability, projected onto a 1000-wide plane with
// the arrondissements and the rivers, simplified for an SVG.
const fs = require("fs")
const [stationsPath, arrPath, riversPath, out] = process.argv.slice(2)
const stations = JSON.parse(fs.readFileSync(stationsPath, "utf8"))
const arr = JSON.parse(fs.readFileSync(arrPath, "utf8"))
const rivers = JSON.parse(fs.readFileSync(riversPath, "utf8"))

const live = stations.filter(s => s.is_installed === "OUI" && s.coordonnees_geo)
const newest = live.map(s => s.duedate).sort().at(-1)
// A station that hasn't reported for two days is out of the snapshot.
const fresh = live.filter(s => new Date(newest) - new Date(s.duedate) < 2 * 864e5)

const lats = fresh.map(s => s.coordonnees_geo.lat), lons = fresh.map(s => s.coordonnees_geo.lon)
const pad = 0.006
const [latMin, latMax, lonMin, lonMax] = [Math.min(...lats) - pad, Math.max(...lats) + pad, Math.min(...lons) - pad, Math.max(...lons) + pad]
const k = Math.cos((48.8566 * Math.PI) / 180)
const W = 1000
const scale = W / ((lonMax - lonMin) * k)
const H = Math.round((latMax - latMin) * scale)
const P = ([lon, lat]) => [+((lon - lonMin) * k * scale).toFixed(1), +((latMax - lat) * scale).toFixed(1)]
const inside = ([x, y]) => x > -20 && x < W + 20 && y > -20 && y < H + 20

const thin = (pts, min) => {
  const kept = [pts[0]]
  for (const p of pts.slice(1)) {
    const q = kept.at(-1)
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= min) kept.push(p)
  }
  return kept
}
const d = pts => "M" + pts.map(p => p.join(",")).join("L")

const arrondissements = arr.features
  .sort((a, b) => a.properties.c_ar - b.properties.c_ar)
  .map(f => {
    const ring = (f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0]).map(P)
    const pts = thin(ring, 1.2)
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length
    return { n: f.properties.c_ar, d: d(pts) + "Z", c: [+cx.toFixed(1), +cy.toFixed(1)] }
  })

const riverPaths = rivers.elements
  .map(e => ({ name: e.tags.name, pts: thin(e.geometry.map(g => P([g.lon, g.lat])), 1.5) }))
  .filter(r => r.pts.some(inside) && r.pts.length > 1)
  .map(r => ({ name: r.name, d: d(r.pts) }))

const rows = fresh.map(s => {
  const [x, y] = P([s.coordonnees_geo.lon, s.coordonnees_geo.lat])
  return [x, y, s.mechanical, s.ebike, s.numdocksavailable, s.name, s.code_insee_commune === "75056" ? 1 : 0]
})

const map = {
  taken: newest,
  source: "Paris Open Data · velib-disponibilite-en-temps-reel",
  width: W,
  height: H,
  stations: rows,
  arrondissements,
  rivers: riverPaths,
}
fs.writeFileSync(out, JSON.stringify(map))
const sum = (i) => rows.reduce((a, r) => a + r[i], 0)
console.log({ stations: rows.length, dropped: stations.length - rows.length, mechanical: sum(2), ebike: sum(3), docks: sum(4), inParis: rows.filter(r => r[6]).length, W, H, bytes: fs.statSync(out).size, taken: newest })
