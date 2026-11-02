"""Exports how the Data Lab's topics were chosen, for the method section.

    python3 scripts/data-lab/export-topics.py

Reads barometers.csv (every figure from the three barometers, with its wave,
source PDF and page) and applies the rule: a topic is in when one of its items
ranks in the top 10 of at least two of the three barometers, averaged over
their waves from late October 2025 to October 2026.

ObSoCo publishes only each wave's top 10, so an item missing from a wave is
bounded: at least 0, at most that wave's 10th value. The rule is applied on
both bounds; where they disagree the rank is marked uncertain. Writes
src/components/data-lab/data/topics.json.
"""
import csv, json, pathlib
from collections import defaultdict

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parents[1] / "src/components/data-lab/data/topics.json"

rows = list(csv.DictReader(open(HERE / "barometers.csv", encoding="utf-8")))
waves, values, meta = defaultdict(list), defaultdict(dict), {}
for r in rows:
    b = r["barometer"]
    if r["wave"] not in waves[b]:
        waves[b].append(r["wave"])
    values[(b, r["item"])][r["wave"]] = float(r["share_pct"])
    meta[(b, r["item"])] = {"topic": r["topic"], "url": r["source_url"], "where": r["where"]}
    if r["source_url"] != "same":
        last_url = r["source_url"]
    meta[(b, r["item"])]["url"] = last_url
    meta[(b, r["item"])]["fieldwork"] = meta[(b, r["item"])].get("fieldwork", {}) | {r["wave"]: r["fieldwork"]}

tenth = {w: sorted((v[w] for (b, _), v in values.items() if b == "obsoco" and w in v), reverse=True)[9] for w in waves["obsoco"]}


def ranks(b, bound):
    mean = {}
    for (bb, item), v in values.items():
        if bb != b:
            continue
        shares = [v.get(w, 0 if bound == "low" else (tenth[w] if b == "obsoco" else 0)) for w in waves[b]]
        mean[item] = sum(shares) / len(shares)
    return {item: (1 + sum(1 for m in mean.values() if m > mean[item]), mean[item]) for item in mean}


items = []
for b in waves:
    low, high = ranks(b, "low"), ranks(b, "high")
    for item in low:
        m = meta[(b, item)]
        items.append({
            "barometer": b, "item": item, "topic": m["topic"],
            "rank": low[item][0], "rankHigh": high[item][0], "share": round(low[item][1], 1), "shareHigh": round(high[item][1], 1),
            "waves": [[w, values[(b, item)].get(w)] for w in waves[b]],
        })

topics = defaultdict(dict)
for it in items:
    best = topics[it["topic"]].get(it["barometer"])
    if best is None or it["rank"] < best["rank"]:
        topics[it["topic"]][it["barometer"]] = it
decision = {}
for t, per in topics.items():
    sure = sum(1 for it in per.values() if it["rank"] <= 10 and it["rankHigh"] <= 10)
    maybe = sum(1 for it in per.values() if min(it["rank"], it["rankHigh"]) <= 10)
    decision[t] = {"count": sure, "countMax": maybe, "in": sure >= 2}

out = {
    "built": __import__("datetime").date.today().isoformat(),
    "rule": {"top": 10, "of": 2},
    "waves": {b: w for b, w in waves.items()},
    "items": sorted(items, key=lambda x: (x["barometer"], x["rank"])),
    "decision": decision,
}
OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print(OUT.name, OUT.stat().st_size // 1024, "KB")
for t, d in sorted(decision.items(), key=lambda x: -x[1]["count"]):
    print(f"  {t:<12} {d['count']}/{d['countMax']}  {'IN' if d['in'] else 'out'}")
