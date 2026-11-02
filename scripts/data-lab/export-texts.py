"""Exports every text behind the squares of "What is said" (the story in
"The state of things"), so each square can be read and followed.

    python3 scripts/data-lab/export-texts.py <design/france-data-lab/questions dir>

Reads the light method's collected files in that folder (collected/): the
Assemblée's questions to the government (an.csv), government statements
(vie-publique, vp.csv) and fact-checks (factchecks.csv). A text belongs to a
topic when the method tagged it so; the counts on the page are the lengths of
these lists.

Fact-checks are cleaned first:
  - claims from another country's own debate are dropped (the francophone
    African fact-checkers, and AFP Factuel's Africa desk): they share the
    language, not the debate;
  - the same claim checked by several outlets becomes one text, with every
    outlet and link kept.
Each outlet's own verdict is kept, as it wrote it, and sorted into five
groups for the "by verdict" view (false, misleading, mixed, true,
manipulated media). The page always attributes a verdict to its outlet.

Writes:
  - src/components/data-lab/data/texts.json: the counts per topic (bundled,
    so the step captions and the squares agree before anything loads);
  - public/data-lab/texts/<topic>.json: the texts of one topic, fetched when
    the reader reaches the squares. Compact arrays, oldest first; repeated
    names go in a "strings" table; the keys are in "keys".
"""
import csv, difflib, json, pathlib, re, sys, unicodedata
from collections import Counter

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "../design/france-data-lab/questions") / "collected"
ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT_COUNTS = ROOT / "src/components/data-lab/data/texts.json"
OUT_DIR = ROOT / "public/data-lab/texts"
rows = lambda name: list(csv.DictReader(open(SRC / name, encoding="utf-8")))
fold = lambda s: "".join(c for c in unicodedata.normalize("NFD", (s or "").lower()) if unicodedata.category(c) != "Mn")
norm = lambda s: re.sub(r"[^a-z0-9]+", " ", fold(s)).strip()

# Another country's debate: outlets that serve it, and AFP Factuel's Africa desk
OTHER_PUBLISHERS = {"Africa Check", "Eleza Fact", "beto.cd"}
OTHER_DEBATE = re.compile(r"ivoir|cote d.ivoire|congo|kinshasa|\brdc\b|togo|tanzanie|afrique du sud|burkina|mbemba|ebola|magyar|nepal")
# Who made a claim: an anonymous post on social media, a named person or
# organisation, or not given by the fact-checker
SOCIAL = re.compile(r"reseaux|tiktok|^x$|\bx\b|facebook|instagram|publication|internaute|utilisateur|compte|video|sources? multiples|^multiple|telegram|youtube|chaine|plusieurs personnes|infographie|graphique|bluesky|^article$")
# A person named alongside posts counts as named; an @handle is a post
NAMED = re.compile(r"ministre|depute|senateur|elon musk|tanguy")
def claimant_kind(c):
    f = fold(c).strip()
    if not f:
        return "u"
    if NAMED.search(f):
        return "n"
    return "s" if f.startswith("@") or SOCIAL.search(f) else "n"
# An outlet's verdict, sorted into five groups: f false, m misleading or
# mostly false, x mixed (partly true, missing context), t true or mostly
# true, p manipulated photo or video
def verdict(rating):
    r = fold(rating)
    if re.search(r"image|video|ia\b", r):
        return "p"
    if re.search(r"plutot faux|trompeur|misleading|partiellement faux", r):
        return "m"
    if r.startswith("faux"):  # "Faux et manque de contexte" is false
        return "f"
    if re.search(r"plutot vrai|^vrai$|^true$", r):
        return "t"
    if re.search(r"en partie|plus complique|contexte", r):
        return "x"
    if re.search(r"faux|false|falsch|errone", r):
        return "f"
    return "x"
# The same claim, worded differently by two outlets (checked by hand)
SAME_CLAIM = [("L'extinction de l'éclairage public induit de la criminalité", "L'absence d'éclairage public la nuit augmente l'insécurité")]

TOPICS = ["cost", "security", "immigration", "public", "health", "environment", "economy", "jobs", "social", "world", "education"]
texts = {t: {"p": [], "g": [], "f": []} for t in TOPICS}
tags = lambda r: [t for t in r["topics"].split(";") if t in texts]

# Questions to the government: date, deputy, group, minister asked, subject, question id
for r in sorted(rows("an.csv"), key=lambda r: r["date"]):
    for t in tags(r):
        texts[t]["p"].append([r["date"], r["deputy"], r["group"], r["minister"], r["analyse"], r["id"]])

# Government statements: date, speaker, role, type, outlet (interviews), subject, vie-publique path
for r in sorted(rows("vp.csv"), key=lambda r: r["date"]):
    who, _, role = r["speakers"].split("; ")[0].partition(" (")
    title = re.sub(r"\s+", " ", r["title"]).strip()
    subject = (title.split(" sur ", 1)[1] if " sur " in title else title).rstrip(". ")
    # DILA cuts titles at 254 characters
    subject = subject[:1].upper() + subject[1:] + ("…" if len(r["title"]) >= 254 else "")
    path = r["url"].split("?")[0].replace("https://www.vie-publique.fr/discours/", "")
    for t in tags(r):
        texts[t]["g"].append([r["date"], who, role.rstrip(")"), r["type"], r["media"], subject, path])

# Fact-checks: clean, merge, then date, claim, who made it, [[outlet, url], ...]
kept, dropped = [], []
for r in rows("factchecks.csv"):
    other = r["publisher"] in OTHER_PUBLISHERS or OTHER_DEBATE.search(fold(r["claim"] + " " + r["claimant"]))
    (dropped if other else kept).append(r)
alias = {norm(b): norm(a) for a, b in SAME_CLAIM}
merged = []
for r in sorted(kept, key=lambda r: r["date"]):
    key = alias.get(norm(r["claim"]), norm(r["claim"]))
    hit = next((m for m in merged if m["key"] == key or difflib.SequenceMatcher(None, m["key"], key).ratio() > 0.9), None)
    if hit:
        if r["url"] not in [b[1] for b in hit["by"]]:
            hit["by"].append([r["publisher"], r["url"], r["rating"].strip()])
        hit["topics"] |= set(tags(r))
        hit["who"] = hit["who"] or r["claimant"]
        continue
    merged.append({"key": key, "date": r["date"], "claim": r["claim"].strip(), "who": r["claimant"],
                   "by": [[r["publisher"], r["url"], r["rating"].strip()]], "topics": set(tags(r))})
for m in merged:
    for t in sorted(m["topics"]):
        texts[t]["f"].append([m["date"], m["claim"], m["who"], m["by"], claimant_kind(m["who"]), verdict(m["by"][0][2])])

# One file per topic; repeated names (deputies, groups, ministers, speakers,
# roles, types, outlets, claimants) go in a table: those fields are indexes.
KEYS = {"p": ["date", "deputy*", "group*", "minister*", "subject", "id"],
        "g": ["date", "speaker*", "role*", "type*", "media*", "subject", "path"],
        "f": ["date", "claim", "claimant*", "outlets [outlet, url, verdict]", "kind (s: social post, n: named, u: not given)", "verdict group (f, m, x, t, p)"]}
OUT_DIR.mkdir(parents=True, exist_ok=True)
for t in TOPICS:
    table, at = [], {}
    def ref(v):
        if v not in at:
            at[v] = len(table)
            table.append(v)
        return at[v]
    body = {k: [[ref(v) if KEYS[k][i].endswith("*") else v for i, v in enumerate(x)] for x in texts[t][k]] for k in "pgf"}
    doc = {"keys": KEYS, "strings": table, **body}
    (OUT_DIR / f"{t}.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))

# For the captions, bundled: who speaks most, per source
def who(t):
    groups = Counter(x[2] for x in texts[t]["p"] if x[2])
    speakers = Counter(x[1] for x in texts[t]["g"] if x[1])
    kinds = Counter(x[4] for x in texts[t]["f"])
    (g, gn), = groups.most_common(1) or [("", 0)]
    (sp, spn), = speakers.most_common(1) or [("", 0)]
    return {"group": g, "groupN": gn, "groups": len(groups), "speaker": sp, "speakerN": spn,
            "social": kinds["s"], "named": kinds["n"], "unknown": kinds["u"],
            "verdicts": dict(Counter(x[5] for x in texts[t]["f"]))}
counts = {"topics": {t: {**{k: len(texts[t][k]) for k in "pgf"}, "who": who(t)} for t in TOPICS},
          "factchecks": {"collected": len(kept) + len(dropped), "otherDebate": len(dropped), "merged": len(kept) - len(merged), "kept": len(merged)}}
OUT_COUNTS.write_text(json.dumps(counts, ensure_ascii=False, indent=1))
size = sum(p.stat().st_size for p in OUT_DIR.glob("*.json")) // 1024
print(f"texts: {len(TOPICS)} topic files, {size} KB in all · fact-checks {counts['factchecks']}")
print({t: counts["topics"][t] for t in TOPICS})
print("verdict groups:", sorted({(x[3][0][2], x[5]) for t in TOPICS for x in texts[t]["f"]}))
print("named claimants:", sorted({x[2] for t in TOPICS for x in texts[t]["f"] if x[4] == "n"}))
print("social claimants:", sorted({x[2] for t in TOPICS for x in texts[t]["f"] if x[4] == "s"}))
