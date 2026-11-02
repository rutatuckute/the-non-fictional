"""Exports where each question comes from, for "The state of things".

    python3 scripts/data-lab/export-origins.py <design/france-data-lab/questions dir>

Reads the light method's output in that folder: subjects.csv (counts per
subject), subjects.json (what defines each subject) and collected/ (the
parliament exchanges, government statements and fact-checks, 22 Oct 2025 →
22 Oct 2026). For each question it writes the counts and a few examples per
source family, most recent first, one parliamentary example per group.
Fact-checkers' verdicts are left out on purpose: the page shows data, not
rulings. Also writes the perception line (what people think), where a
barometer asked a matching question, and the counts behind the Education
exception. Writes src/components/data-lab/data/origins.json.
"""
import csv, json, pathlib, re, sys, unicodedata
from collections import defaultdict

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "../design/france-data-lab/questions")
OUT = pathlib.Path(__file__).resolve().parents[2] / "src/components/data-lab/data/origins.json"
fold = lambda s: "".join(c for c in unicodedata.normalize("NFD", (s or "").lower()) if unicodedata.category(c) != "Mn")
rows = lambda name: list(csv.DictReader(open(SRC / name, encoding="utf-8")))

FF = ["Fractures françaises, oct. 2025", "Fractures françaises, Oct 2025"]
# question id → (subject id, perception line or None)
QUESTIONS = {
    "prices": ("prices", (["57 % disent joindre difficilement les deux bouts", "57% say they find it hard to make ends meet"], 20)),
    "fuel": ("fuel_energy", None),
    "fuel_eu": ("fuel_taxes_neighbours", None),
    "shortage": ("fuel_energy", None),
    "violence": ("violence", (["67 % ont le sentiment que la violence augmente beaucoup dans la société française", "67% feel that violence in French society is increasing a lot"], 35)),
    "sexual_violence": ("sexual_violence", None),
    "immigration": ("immigration_level", (["65 % estiment qu'« il y a trop d'étrangers en France »", "65% agree that ‘there are too many foreigners in France’"], 61)),
    "removals": ("irregular", None),
    "debt": ("debt", None),
    "tax_fairness": ("tax_fairness", (["60 % jugent que pour établir la justice sociale, « il faudrait prendre aux riches pour donner aux pauvres »", "60% agree that for social justice ‘we should take from the rich to give to the poor’"], 81)),
    "doctors": ("access", (["62 % peuvent accéder rapidement à tous les principaux services publics là où ils vivent (hôpital, médecin…), 33 % en zone rurale", "62% can quickly reach all the main public services where they live (hospital, doctor…), 33% in rural areas"], 143)),
    "mental_health": ("mental_health", None),
    "heat": ("heat", (["74 % se disent préoccupés par le changement climatique", "74% say they are concerned about climate change"], 92)),
    "emissions": ("emissions", None),
    "industry": ("industry", None),
    "farm_income": ("agriculture", None),
    "unemployment": ("unemployment", None),
    "youth": ("youth_jobs", None),
    "pensioners": ("pensions", None),
    "fraud": ("social_fraud", None),
    "teachers": ("teachers", None),
    "school_spending": ("school_spending", (["53 % ne pensent pas que l'école donne la même chance de réussite à tout le monde", "53% don't think school gives everyone the same chance of success"], 87)),
    "classes": ("classes", None),
}

subjects = {r["id"]: r for r in rows("subjects.csv")}
defs = {s["id"]: s for t, v in json.load(open(SRC / "subjects.json", encoding="utf-8")).items() if not t.startswith("_") for s in v}
an = {r["id"]: r for r in rows("collected/an.csv")}
vp = rows("collected/vp.csv")
fc = rows("collected/factchecks.csv")

out = {}
for qid, (sid, perception) in QUESTIONS.items():
    s, d = subjects[sid], defs[sid]
    seen, parliament = set(), []
    for r in sorted((an[i] for i in s["an_ids"].split(",") if i), key=lambda r: r["date"], reverse=True):
        if r["group"] in seen:
            continue
        seen.add(r["group"])
        parliament.append({"date": r["date"], "group": r["group"], "who": r["deputy"], "to": r["minister"], "label": r["analyse"], "url": r["url"]})
    rx_vp, rx_fc = re.compile(d["vp"]), re.compile(d["fc"])
    topic = s["topic"]
    # Counted on the title and DILA's index; shown only where the title itself
    # says what the statement is about, so an example never looks off-subject.
    matched = [r for r in vp if topic in r["topics"].split(";") and rx_vp.search(fold(r["title"].split(" sur ", 1)[-1] + " ; " + r["descripteurs"] + " ; " + r["thematiques"]))]
    # Statements whose title leads with the subject come first, then the most recent.
    subject_of = lambda r: fold(r["title"].split(" sur ", 1)[-1])
    by_title = [r for r in matched if rx_vp.search(subject_of(r))] or matched
    lead = lambda r: (m.start() if (m := rx_vp.search(subject_of(r))) else 999)
    by_title = sorted(by_title, key=lambda r: (lead(r) > 40, r["date"]), reverse=False)
    by_title = [r for r in by_title if lead(r) <= 40][::-1] + [r for r in by_title if lead(r) > 40][::-1]
    government = [
        {"date": r["date"], "who": r["speakers"].split(" (")[0], "title": r["title"].split(" sur ", 1)[-1].rstrip("."), "url": r["url"].split("?")[0]}
        for r in by_title[:2]
    ]
    checks = list({fold(r["claim"]): r for r in fc if rx_fc.search(fold(r["claim"]))}.values())
    factchecks = [{"date": r["date"], "who": r["claimant"], "claim": r["claim"], "publisher": r["publisher"], "url": r["url"]} for r in sorted(checks, key=lambda r: r["date"], reverse=True)][:3]
    out[qid] = {
        "subject": [s["fr"], s["en"]],
        "counts": {"parliament": int(s["parliament"]), "groups": int(s["groups"]), "government": int(s["government"]), "factchecks": int(s["factchecks"])},
        "parliament": parliament[:4], "government": government, "factchecks": factchecks,
        "perception": {"text": perception[0], "source": FF, "page": perception[1]} if perception else None,
    }

# The counts behind the Education exception: everything tagged Education in the window.
an_edu = [r for r in an.values() if "education" in r["topics"].split(";")]
vp_edu = [r for r in vp if "education" in r["topics"].split(";")]
exception = {"education": {"parliament": len(an_edu), "groups": len({r["group"] for r in an_edu}), "government": len(vp_edu), "until": max(r["date"] for r in an.values())}}

# How the questions were chosen, for the method section: what each source holds,
# what it says per topic, every subject found, and which became questions.
chosen = defaultdict(list)
for qid, (sid, _) in QUESTIONS.items():
    chosen[sid].append(qid)
method = {
    "sources": {"parliament": len(an), "government": len(vp), "factchecks": len(fc), "parliamentUntil": max(r["date"] for r in an.values())},
    "topics": {},
}
for r in subjects.values():
    t = r["topic"]
    if t not in method["topics"]:
        method["topics"][t] = {
            "parliament": sum(1 for x in an.values() if t in x["topics"].split(";")),
            "government": sum(1 for x in vp if t in x["topics"].split(";")),
            "factchecks": sum(1 for x in fc if t in x["topics"].split(";")),
            "subjects": [],
        }
    method["topics"][t]["subjects"].append({
        "id": r["id"], "name": [r["fr"], r["en"]], "families": int(r["families"]), "groups": int(r["groups"]),
        "parliament": int(r["parliament"]), "government": int(r["government"]), "factchecks": int(r["factchecks"]),
        "passes": r["passes"] == "yes", "questions": chosen.get(r["id"], []),
    })

OUT.write_text(json.dumps({"window": ["2025-10-22", "2026-10-22"], "questions": out, "exception": exception, "method": method}, ensure_ascii=False, separators=(",", ":")))
print(OUT.name, OUT.stat().st_size // 1024, "KB", len(out), "questions · exception", exception)
