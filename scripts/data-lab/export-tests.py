"""Exports the official figures that test a thread's claim, for the opening
of "What the data says" (the claim breaks into its measurable parts, then a
chart of the figures builds beneath it).

    python3 scripts/data-lab/export-tests.py <france-protests-story dir>

Cost of living: « Tous nos voisins européens ont baissé les taxes sur les
carburants » (Julien Odoul, RN, 21 April 2026). Tested with the European
Commission's Weekly Oil Bulletin: taxes per litre of diesel (price with
taxes minus price without, so excise duties and VAT together), France and
its neighbours in the bulletin, the week before the energy crisis
(23 February 2026) against the week of the claim (20 April 2026), and the
first week after it (to show what came later). VAT follows the price, so
without any change in policy the tax per litre rises when prices rise; a
cut shows as a fall. Writes src/components/data-lab/data/tests.json.

Separating price from policy (added 2026-11-01). A change in tax per litre is
not by itself a change in tax policy: VAT is a percentage of the price, so it
rises when the pre-tax price rises. With each country's standard VAT rate v,
the fixed part of the tax (excise and similar duties, per litre) is
    excise = price_with_tax / (1 + v) - price_without_tax
It stays flat, to the tenth of a cent, in every week where no rate changed
(France 0.608, Belgium 0.600, Luxembourg 0.465, Germany 0.632 until May), which
is how the standard rates below were checked. The change in tax per litre
between the two weeks then splits into
    price effect = tax the claim week would carry at pre-crisis rates - tax before
    rate effect  = actual tax the claim week - that counterfactual
Rate changes are then checked against the countries' own decisions (MEASURES).
"""
import csv, json, pathlib, sys

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "../../the-non-fictional-data-stories/repo/france-protests-story")
OUT = pathlib.Path(__file__).resolve().parents[2] / "src/components/data-lab/data/tests.json"

BEFORE, CLAIM, AFTER = "2026-02-23", "2026-04-20", "2026-05-04"
COUNTRIES = ["FR", "BE", "DE", "ES", "IT", "LU"]  # France, then its neighbours in the bulletin

# Standard VAT rates before the crisis (European Commission, "VAT rates applied
# in the Member States"); fuel is taxed at the standard rate in all six.
VAT = {"FR": 0.20, "BE": 0.21, "DE": 0.19, "ES": 0.21, "IT": 0.22, "LU": 0.17}
# Rate changes found in each country's own decisions, February to May 2026.
# None found for France, Belgium or Luxembourg; their fixed part stays flat.
MEASURES = {
    "ES": {
        "from": "2026-03",
        "what": ["TVA de 21 % à 10 %, accise ramenée au minimum européen (RDL 7/2026)", "VAT cut from 21% to 10%, excise cut to the EU minimum (RDL 7/2026)"],
        "source": ["CNMC", "https://www.cnmc.es/en/node/420673"],
    },
    "IT": {
        "from": "2026-03-19",
        "what": ["Accise −20 centimes par litre (DL 33/2026)", "Excise −20 cents per litre (DL 33/2026)"],
        "source": ["Sky TG24", "https://tg24.sky.it/economia/2026/03/19/prezzo-benzina-diesel-taglio-accise"],
    },
    "DE": {
        "from": "2026-05-01",
        "what": ["Taxe sur l'énergie −14,04 centimes par litre, 1er mai – 30 juin", "Energy tax −14.04 cents per litre, 1 May – 30 June"],
        "source": ["PwC Deutschland", "https://blogs.pwc.de/de/steuern-und-recht/article/254299/update-bundestag-stimmt-gesetz-zur-senkung-der-energiesteuern-zu/"],
    },
}

price = {}
for r in csv.DictReader(open(SRC / "data/processed/oil_bulletin.csv")):
    if r["product"] == "diesel" and r["geo"] in COUNTRIES and BEFORE <= r["week"] <= AFTER:
        price[(r["geo"], r["week"])] = (float(r["eur_l_with_tax"]), float(r["eur_l_without_tax"]))
WEEKS = sorted({w for _, w in price})
tax = {k: round(a - b, 3) for k, (a, b) in price.items()}


def split(g):
    v = VAT[g]
    (wb, pb), (wc, pc) = price[(g, BEFORE)], price[(g, CLAIM)]
    excise = wb / (1 + v) - pb
    counterfactual = (pc + excise) * (1 + v) - pc
    return {
        "excise": round(excise, 3),
        "pretax": [round(pb, 3), round(pc, 3)],
        "price": round(counterfactual - (wb - pb), 3),
        "rate": round((wc - pc) - counterfactual, 3),
    }


rows = [
    {
        "geo": g,
        "before": tax[(g, BEFORE)],
        "claim": tax[(g, CLAIM)],
        "after": tax[(g, AFTER)],
        **split(g),
        # the fixed part, week by week, at the pre-crisis VAT rate
        "fixed": [round(price[(g, w)][0] / (1 + VAT[g]) - price[(g, w)][1], 3) for w in WEEKS],
        **({"measure": MEASURES[g]} if g in MEASURES else {}),
    }
    for g in COUNTRIES
]
out = {
    "cost": {
        "weeks": {"before": BEFORE, "claim": CLAIM, "after": AFTER},
        "unit": "eur_per_litre",
        "vat": VAT,
        "series": WEEKS,
        "rows": rows,
        "source": ["Commission européenne, Bulletin pétrolier hebdomadaire (gazole)", "European Commission, Weekly Oil Bulletin (diesel)"],
    }
}
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
for r in rows:
    print(r["geo"], r["before"], "→", r["claim"], f"({r['claim'] - r['before']:+.3f})", "· 4 May", r["after"], "· price", r["price"], "rate", r["rate"], "fixed", min(r["fixed"]), max(r["fixed"]))
