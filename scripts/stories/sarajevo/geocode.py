# Looks up each place on OpenStreetMap (Nominatim), one request a second as its
# usage policy asks, and keeps the first hit inside central Sarajevo.
import json, time, urllib.parse, urllib.request
PLACES = [
  ("markale", "Markale", "shopping", ["Markale, Sarajevo", "Markale tržnica Sarajevo"]),
  ("eternal-flame", "Eternal Flame", "sight", ["Vječna vatra, Sarajevo", "Eternal Flame Sarajevo"]),
  ("papagajka", "Papagajka", "sight", ["Papagajka, Sarajevo"]),
  ("inat-kuca", "Inat Kuća", "sight", ["Inat kuća, Sarajevo"]),
  ("assassination", "Assassination of Archduke Franz Ferdinand", "sight", ["Latinska ćuprija, Sarajevo", "Latin Bridge Sarajevo"]),
  ("museum-genocide", "Museum of Crimes Against Humanity & Genocide", "sight", ["Museum of Crimes Against Humanity and Genocide Sarajevo", "Muzej zločina protiv čovječnosti i genocida Sarajevo"]),
  ("central-bank", "Central Bank", "sight", ["Centralna banka Bosne i Hercegovine, Sarajevo"]),
  ("sniper-alley", "Sniper Alley", "sight", ["Zmaja od Bosne, Sarajevo"]),
  ("city-hall", "Sarajevo City Hall & Library", "sight", ["Vijećnica, Sarajevo", "Sarajevo City Hall"]),
  ("bobsled", "Sarajevo Abandoned Bobsled Track", "sight", ["Bob staza, Trebević, Sarajevo", "Sarajevo bobsleigh track"]),
  ("zlatna-ribica", "Zlatna Ribica", "bar", ["Zlatna ribica, Sarajevo"]),
  ("blind-tiger", "Blind Tiger", "bar", ["Blind Tiger, Sarajevo"]),
  ("brewery", "Sarajevo Brewery", "bar", ["Sarajevska pivara, Sarajevo", "Sarajevo Brewery"]),
  ("sac", "Sač", "food", ["Sač, Bravadžiluk, Sarajevo", "Buregdžinica Sač Sarajevo"]),
  ("petica", "Ćevabdžinica Petica Ferhatović", "food", ["Petica Ferhatović, Sarajevo", "Ćevabdžinica Petica Sarajevo"]),
  ("cejf", "Ministry of Ćejf", "tea", ["Ministarstvo ćejfa, Sarajevo", "Ministry of Cejf Sarajevo"]),
  ("dzirlo", "Teahouse Džirlo", "tea", ["Džirlo, Sarajevo", "Caj kuca Dzirlo Sarajevo"]),
  ("divan-saraj", "Divan Saraj", "tea", ["Divan Saraj, Sarajevo"]),
  ("miris-dunja", "Miris Dunja", "tea", ["Miris dunja, Sarajevo"]),
  ("baklava-ducan", "Baklava Dućan", "sweets", ["Baklava Dućan, Sarajevo"]),
  ("cream-shop", "Cream Shop", "sweets", ["Cream shop, Sarajevo"]),
  ("kazandzijska", "Kazandžijske Radnje Huseinović", "shopping", ["Kazandžiluk, Sarajevo", "Huseinović kazandžija Sarajevo"]),
]
BBOX = (18.383, 43.832, 18.452, 43.868)
out = []
for key, name, kind, queries in PLACES:
    hit = None
    for q in queries:
        url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({"q": q, "format": "json", "limit": 5, "viewbox": ",".join(map(str, BBOX)), "bounded": 1})
        req = urllib.request.Request(url, headers={"User-Agent": "the-non-fictional-mockup/1.0 (hamed@finna.ai)"})
        try:
            res = json.load(urllib.request.urlopen(req, timeout=30))
        except Exception as e:
            res = []
        time.sleep(1.1)
        if res:
            hit = res[0]; break
    out.append({"key": key, "name": name, "kind": kind, "lat": float(hit["lat"]) if hit else None, "lon": float(hit["lon"]) if hit else None, "osm": hit["display_name"][:90] if hit else None})
    print(f"{key:16} {'OK ' if hit else 'MISS'} {out[-1]['lat']} {out[-1]['lon']} {out[-1]['osm']}")
json.dump(out, open("places.json", "w"), ensure_ascii=False, indent=1)
