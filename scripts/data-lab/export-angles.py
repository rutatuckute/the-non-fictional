"""Exports the angles of each topic for the story's "angles" step: what a
topic is discussed as, how much, and one real example per source.

    python3 scripts/data-lab/export-angles.py <design/france-data-lab/questions dir>

Reads the light method's output in that folder: subjects.json (the keyword
rules that define each angle), subjects.csv (the counts and the Assemblée
questions per angle) and collected/ (the texts). For each angle, the most
recent example of each kind: a question to the government, a government
statement whose own title names the angle (so an example never looks
off-subject), and a fact-checked claim (claims from another country's own
debate left out, as in export-texts.py). Verdicts are kept with their outlet.
Writes src/components/data-lab/data/angles.json.
"""
import csv, json, pathlib, re, sys, unicodedata

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "../design/france-data-lab/questions")
ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "src/components/data-lab/data/angles.json"
csv.field_size_limit(10**8)
rows = lambda name: list(csv.DictReader(open(SRC / name, encoding="utf-8")))
fold = lambda s: "".join(c for c in unicodedata.normalize("NFD", (s or "").lower()) if unicodedata.category(c) != "Mn")

OTHER_PUBLISHERS = {"Africa Check", "Eleza Fact", "beto.cd"}
OTHER_DEBATE = re.compile(r"ivoir|cote d.ivoire|congo|kinshasa|\brdc\b|togo|tanzanie|afrique du sud|burkina|mbemba|ebola|magyar|nepal")

defs = {t: v for t, v in json.load(open(SRC / "subjects.json", encoding="utf-8")).items() if not t.startswith("_")}
counts = {r["id"]: r for r in rows("subjects.csv")}
an = {r["id"]: r for r in rows("collected/an.csv")}
vp = rows("collected/vp.csv")
fc = [r for r in rows("collected/factchecks.csv")
      if r["publisher"] not in OTHER_PUBLISHERS and not OTHER_DEBATE.search(fold(r["claim"] + " " + r["claimant"]))]
origins = json.load(open(ROOT / "src/components/data-lab/data/origins.json"))
subject_of = lambda r: fold(r["title"].split(" sur ", 1)[-1])

# Angles overlap (one text can touch several): each angle prefers an example
# no larger angle has shown yet.
def first_new(candidates, used, key):
    for r in candidates:
        if key(r) not in used:
            used.add(key(r))
            return r
    return candidates[0] if candidates else None

out = {}
for topic, subjects in defs.items():
    angles = []
    used = set()
    # the larger angles choose their examples first
    subjects = sorted(subjects, key=lambda d: -sum(int(counts[d["id"]][k]) for k in ("parliament", "government", "factchecks")) if d["id"] in counts else 0)
    method = {s["id"]: s for s in origins["method"]["topics"].get(topic, {}).get("subjects", [])}
    for d in subjects:
        c = counts.get(d["id"])
        if not c:
            continue
        rx_vp, rx_fc = re.compile(d["vp"]), re.compile(d["fc"])
        # the most recent Assemblée question on this angle
        qs = sorted((an[i] for i in c["an_ids"].split(",") if i in an), key=lambda r: r["date"], reverse=True)
        p = first_new(qs, used, lambda r: r["id"])
        # the most recent statement whose title names the angle
        gs = sorted((r for r in vp if topic in r["topics"].split(";") and rx_vp.search(subject_of(r))), key=lambda r: r["date"], reverse=True)
        g = first_new(gs, used, lambda r: r["url"])
        # the most recent fact-checked claim on it
        fs = sorted((r for r in fc if rx_fc.search(fold(r["claim"]))), key=lambda r: r["date"], reverse=True)
        f = first_new(fs, used, lambda r: r["url"])
        title = (g["title"].split(" sur ", 1)[-1].strip().rstrip(". ") if g else "")
        angles.append({
            "id": d["id"],
            "name": [d["fr"], d["en"]],
            "n": {"p": int(c["parliament"]), "g": int(c["government"]), "f": int(c["factchecks"])},
            "questions": method.get(d["id"], {}).get("questions", []),
            "examples": {
                "p": {"date": p["date"], "who": p["deputy"], "group": p["group"], "subject": p["analyse"], "url": p["url"]} if p else None,
                "g": {"date": g["date"], "who": g["speakers"].split(" (")[0], "type": g["type"], "media": g["media"],
                      "subject": title[:1].upper() + title[1:] + ("…" if len(g["title"]) >= 254 else ""),
                      "url": g["url"].split("?")[0]} if g else None,
                "f": {"date": f["date"], "claim": f["claim"].strip(), "claimant": f["claimant"], "publisher": f["publisher"],
                      "rating": f["rating"].strip(), "url": f["url"]} if f else None,
            },
        })
    angles.sort(key=lambda a: -(a["n"]["p"] + a["n"]["g"] + a["n"]["f"]))
    out[topic] = angles

OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
for t, a in out.items():
    print(t, [(x["id"], sum(x["n"].values()), "".join(k for k, v in x["examples"].items() if v)) for x in a])
