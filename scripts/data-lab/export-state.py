"""Exports the data behind the Data Lab's "State of things" section.

    python3 scripts/data-lab/export-state.py <france-protests-story dir>

Reads the processed tables of the data pipeline (the-non-fictional-data-stories,
france-protests-story/data/processed) and writes two compact files next to the
component, in src/components/data-lab/data/:

- state.json: every series the questions draw on, already cut to what the page
  shows and rounded to the precision it prints.
- geo.json: the départements as SVG paths on a 1000-wide plane, the overseas
  ones as insets, plus the frame of the Paris close-up.

Standard library only, so it runs anywhere the CSVs are.
"""
import csv, datetime as dt, json, pathlib, re, sys
from collections import defaultdict

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
P = SRC / "data/processed"
OUT = pathlib.Path(__file__).resolve().parents[2] / "src/components/data-lab/data"
OUT.mkdir(parents=True, exist_ok=True)


def rows(path):
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def last(values):
    return max(i for i, v in enumerate(values) if v is not None)


# Prices: year-on-year HICP for France and the euro area, since 2019
hicp = defaultdict(dict)
for r in rows(P / "hicp.csv"):
    if r["geo"] in ("FR", "EA") and r["item_code"] in ("TOTAL", "CP011", "NRG", "CP0411", "TOT_X_NRG_FOOD") and r["yoy_pct"] and r["month"] >= "2019-01":
        hicp[f'{r["geo"]}:{r["item_code"]}'][r["month"]] = round(float(r["yoy_pct"]), 1)
months = sorted({m for s in hicp.values() for m in s})

# Fuel at the pump: the EU Weekly Oil Bulletin, France since 2005 and the neighbours' latest week
COUNTRIES = ("FR", "DE", "IT", "ES", "BE", "NL", "LU", "EA")
oil = defaultdict(dict)
for r in rows(P / "oil_bulletin.csv"):
    if r["product"] in ("diesel", "euro_super_95") and r["geo"] in COUNTRIES and r["eur_l_with_tax"] and r["eur_l_without_tax"]:
        oil[(r["geo"], r["product"])][r["week"]] = (round(float(r["eur_l_with_tax"]), 3), round(float(r["eur_l_without_tax"]), 3))
weeks = sorted(set(oil[("FR", "diesel")]) | set(oil[("FR", "euro_super_95")]))
latest = max(oil[("FR", "diesel")])
year_ago = max(w for w in oil[("FR", "diesel")] if w <= (dt.date.fromisoformat(latest) - dt.timedelta(days=364)).isoformat())
fuel_eu = {
    "week": latest,
    "yearAgoWeek": year_ago,
    "rows": sorted(([g, *oil[(g, "diesel")][latest]] for g in COUNTRIES if latest in oil[(g, "diesel")]), key=lambda x: -x[1]),
    "yearAgo": {g: oil[(g, "diesel")].get(year_ago, (None,))[0] for g in COUNTRIES},
}

# Stations: daily median diesel price and the share of stations out of diesel
price, short = defaultdict(dict), defaultdict(dict)
for r in rows(P / "fuel_prices_daily.csv"):
    if r["fuel"] == "gazole":
        price[r["geo"]][r["date"]] = round(float(r["median"]), 3)
for r in rows(P / "fuel_shortages_daily.csv"):
    if r["fuel"] == "gazole":
        short[r["geo"]][r["date"]] = (round(float(r["share_out"]) * 100, 1), int(r["stations_out"]))
days = sorted(price["FR"])
day = days[-1]

# Jobs: national rate by age since 2015, département rate in the latest quarter
unemp = defaultdict(dict)
for r in rows(P / "unemployment_national.csv"):
    if r["measure"] == "rate" and r["sex"] == "all":
        unemp[r["age"]][r["quarter"]] = float(r["value"])
quarters = sorted(unemp["all"])
unemp_dep = {r["code"]: float(r["rate"]) for r in rows(P / "unemployment_dep.csv") if r["level"] == "dep" and r["quarter"] == quarters[-1]}

# Lycées: pupils per teaching group (E/S) and funded teaching hours per pupil
# (H/E), from the DEPP's per-school files, recomputed from sums (never a mean
# of ratios). All sectors; general/technological (lgt), vocational (lp) and both.
school = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, 0.0, 0.0]))
for r in rows(P / "dep_school_resources.csv"):
    if r["sector"] != "all" or r["niveau"] not in ("all", "lgt", "lp") or not r["es_hours"]:
        continue
    for key in (("FR", r["niveau"]), (r["dep"], r["niveau"])):
        acc = school[r["rentree"]][key]
        acc[0] += float(r["es_num"]); acc[1] += float(r["es_hours"]); acc[2] += float(r["hours"]); acc[3] += float(r["pupils"])
years = sorted(school)
school_out = {
    "years": years,
    "es": {n: [round(school[y][("FR", n)][0] / school[y][("FR", n)][1], 2) for y in years] for n in ("all", "lgt", "lp")},
    "he": {n: [round(school[y][("FR", n)][2] / school[y][("FR", n)][3], 3) for y in years] for n in ("all", "lgt", "lp")},
    "esDep": {dep: round(a[0] / a[1], 1) for (dep, n), a in sorted(school[years[-1]].items()) if dep != "FR" and n == "all" and a[1]},
}

# Government statements on the matching topics, from vie-publique.fr
speeches = [
    {"date": r["date"], "who": r["officials"] or r["emitter"], "media": r["media"], "title": r["title"], "url": r["url"]}
    for r in rows(P / "speeches.csv") if r["match"] == "1"
]

# Security: recorded victims (SSMSI). Monthly CVS-CJO series for France, the
# département base summed for the annual national figures, and 2025 rates per
# 1,000 inhabitants by département.
CRIME_MONTHLY = {
    "physOut": ("Violences physiques", "Violences physiques hors du cadre familial"),
    "physIn": ("Violences physiques", "Violences physiques intrafamiliales"),
    "sexual": ("Violences sexuelles", ""),
}
crime_m = defaultdict(dict)
crime_conj = {}
for r in rows(P / "crime_national.csv"):
    if r["frequency"] == "monthly" and r["adjustment"] == "CVS-CJO":
        for key, (cat, note) in CRIME_MONTHLY.items():
            if r["category"] == cat and r["note"] == note:
                crime_m[key][r["period"]] = int(float(r["value"]))
    elif r["frequency"] == "annual" and r["unit"] == "Victimes" and r["sub_indicator"] == "Ensemble des lieux":
        if r["indicator"].startswith("Violences physiques intrafamiliales conjugales"):
            crime_conj.setdefault("conjugal", {})[r["period"]] = int(float(r["value"]))
        elif r["indicator"].startswith("Violences physiques intrafamiliales non conjugales"):
            crime_conj.setdefault("nonConjugal", {})[r["period"]] = int(float(r["value"]))
crime_months = sorted(crime_m["sexual"])
CRIME_DEP = {
    "physOut": "Violences physiques hors cadre familial",
    "physIn": "Violences physiques intrafamiliales",
    "sexual": "Violences sexuelles",
    "homicide": "Homicides",
    "attempt": "Tentatives d'homicide",
}
crime_y, crime_rate = defaultdict(lambda: defaultdict(int)), defaultdict(dict)
for r in rows(P / "crime_dep.csv"):
    for key, name in CRIME_DEP.items():
        if r["indicator"] == name:
            crime_y[key][r["year"]] += int(float(r["count"]))
            if r["year"] == "2025" and key in ("physOut", "sexual"):
                crime_rate[key][r["dep"]] = round(float(r["rate_per_1000"]), 2)
crime_years = sorted(crime_y["physOut"])
crime = {
    "months": crime_months,
    "monthly": {k: [crime_m[k].get(m) for m in crime_months] for k in CRIME_MONTHLY},
    "years": crime_years,
    "annual": {k: [crime_y[k][y] for y in crime_years] for k in CRIME_DEP}
    | {k: [v.get(y) for y in crime_years] for k, v in crime_conj.items()},
    "dep": {k: dict(sorted(v.items())) for k, v in crime_rate.items()},
}

# Migration (Eurostat): France's permits by reason, asylum and removals; the
# neighbours per 1,000 inhabitants; Insee's immigrant share.
mig = defaultdict(dict)
for r in rows(P / "migration_eu.csv"):
    mig[(r["dataset"], r["geo"], r["measure"], r["category"])][r["period"]] = float(r["value"])
mig_years = [str(y) for y in range(2008, 2026)]
asylum_months = sorted(mig[("migr_asyappctzm", "FR", "asylum_first_time", "total")])
mig_quarters = sorted(mig[("migr_eirtn1", "FR", "returned", "total")])
NEIGHBOURS = ("FR", "DE", "IT", "ES", "BE", "NL", "EU27_2020")
per_k = lambda ds, m, g, y: round(mig[(ds, g, m, "total")][y] / mig[("demo_pjan", g, "population", "total")][y] * 1000, 2)
immigrants = [r for r in rows(P / "immigrants_fr.csv") if int(r["year"]) >= 2006]
migration = {
    "years": mig_years,
    "permits": {c: [mig[("migr_resfirst", "FR", "first_permits", c)].get(y) for y in mig_years] for c in ("total", "family", "education", "employment", "other")},
    "asylum": [mig[("migr_asyappctza", "FR", "asylum_first_time", "total")].get(y) for y in mig_years],
    "asylumMonths": asylum_months,
    "asylumM": [mig[("migr_asyappctzm", "FR", "asylum_first_time", "total")][m] for m in asylum_months],
    "ordered": [mig[("migr_eiord", "FR", "ordered_to_leave", "total")].get(y) for y in mig_years],
    "returned": [mig[("migr_eirtn", "FR", "returned", "total")].get(y) for y in mig_years],
    "quarters": mig_quarters,
    "returnedQ": {c: [mig[("migr_eirtn1", "FR", "returned", c)].get(q) for q in mig_quarters] for c in ("total", "forced", "assisted_voluntary", "non_assisted_voluntary")},
    "perK": [[g, per_k("migr_resfirst", "first_permits", g, "2025"), per_k("migr_asyappctza", "asylum_first_time", g, "2025")] for g in NEIGHBOURS],
    "immigrants": {
        "years": [r["year"] for r in immigrants],
        "share": [float(r["immigrants_share_pct"]) for r in immigrants],
        "count": [int(r["immigrants"]) for r in immigrants],
    },
}

# Public debt: Insee for France since 1995, Eurostat for the neighbours
debt_fr = defaultdict(dict)
for r in rows(P / "debt_fr.csv"):
    debt_fr[r["measure"]][r["quarter"]] = float(r["value"])
debt_quarters = sorted(debt_fr["debt_pct_gdp"])
debt_eu = defaultdict(dict)
for r in rows(P / "debt_eu.csv"):
    if r["unit"] == "PC_GDP" and r["value"]:
        debt_eu[r["geo"]][r["quarter"]] = float(r["value"])
debt_last = max(debt_eu["FR"])
debt = {
    "quarters": debt_quarters,
    "pct": [debt_fr["debt_pct_gdp"][q] for q in debt_quarters],
    "eur": [debt_fr["debt_eur_bn"].get(q) for q in debt_quarters],
    "eu": {g: [debt_eu[g].get(q) for q in debt_quarters] for g in ("EA21", "DE", "IT")},
    "euQuarter": debt_last,
    "euRows": sorted(([g, debt_eu[g][debt_last]] for g in ("FR", "DE", "IT", "ES", "BE", "NL", "EA21", "EU27_2020") if debt_last in debt_eu[g]), key=lambda x: -x[1]),
}

# Industrial jobs: national since 1970, change by département since end 2019
ind = defaultdict(dict)
for r in rows(P / "industry_jobs_national.csv"):
    ind[r["series"]][r["quarter"]] = float(r["jobs_k"])
ind_quarters = sorted(ind["industry"])
ind_dep = defaultdict(dict)
for r in rows(P / "industry_jobs_dep.csv"):
    if r["level"] == "dep":
        ind_dep[r["code"]][r["quarter"]] = float(r["jobs"])
ind_last = ind_quarters[-1]
industry = {
    "quarters": ind_quarters,
    "industry": [ind["industry"][q] for q in ind_quarters],
    "manufacturing": [ind["manufacturing"].get(q) for q in ind_quarters],
    "dep": {d: round((v[ind_last] / v["2019-Q4"] - 1) * 100, 1) for d, v in sorted(ind_dep.items()) if ind_last in v and "2019-Q4" in v},
}

# Standard of living by activity status: the newest method for each year, and
# the years where Insee's method changed
living_raw = defaultdict(dict)
for r in rows(P / "living_standard_by_status.csv"):
    if r["stat"] == "median" and r["eur_2024"]:
        seg = int(r["segment"])
        cur = living_raw[r["key"]].get(r["year"])
        if cur is None or seg > cur[0]:
            living_raw[r["key"]][r["year"]] = (seg, int(float(r["eur_2024"])))
living_years = sorted(living_raw["all"])
segments = {y: living_raw["all"][y][0] for y in living_years}
living = {
    "years": living_years,
    **{k: [living_raw[k][y][1] if y in living_raw[k] else None for y in living_years] for k in ("retired", "employed", "all", "unemployed")},
    "breaks": [y for i, y in enumerate(living_years) if i and segments[y] != segments[living_years[i - 1]]],
}

# Doctors: GP density since 2012 (all GPs, and those in private practice),
# density by département in the latest year, and APL below 2.5
doc = defaultdict(dict)
doc_dep = {}
for r in rows(P / "doctors_density_dep.csv"):
    if r["specialty"] not in ("general_practice", "all") or not r["density_per_100k"]:
        continue
    v = float(r["density_per_100k"])
    if r["level"] == "fe":
        doc[(r["specialty"], r["practice"])][r["year"]] = v
    elif r["level"] == "dep" and r["specialty"] == "general_practice" and r["practice"] == "all":
        doc_dep.setdefault(r["year"], {})[r["code"]] = round(v)
doc_years = sorted(doc[("general_practice", "all")])
apl = defaultdict(lambda: [0, 0, 0])
for r in rows(P / "apl_gp_commune.csv"):
    if not r["pop"] or not r["apl"]:
        continue
    acc = apl[r["year"]]
    pop = float(r["pop"])
    acc[0] += pop
    acc[1] += pop if float(r["apl"]) < 2.5 else 0
    acc[2] += pop if r["apl_gp_le65"] and float(r["apl_gp_le65"]) < 2.5 else 0
apl_years = sorted(apl)
doctors = {
    "years": doc_years,
    "gp": [round(doc[("general_practice", "all")][y], 1) for y in doc_years],
    "gpPrivate": [round(doc[("general_practice", "liberal")].get(y, 0) + doc[("general_practice", "mixed")].get(y, 0), 1) for y in doc_years],
    "all": [round(doc[("all", "all")][y], 1) for y in doc_years],
    "dep": dict(sorted(doc_dep[doc_years[-1]].items())),
    "aplYears": apl_years,
    "aplUnder": [round(apl[y][1] / apl[y][0] * 100, 1) for y in apl_years],
    "aplUnder65": [round(apl[y][2] / apl[y][0] * 100, 1) for y in apl_years],
}

# Emissions: Citepa Secten by sector since 1990, the monthly barometer for the
# first half of the year, Eurostat for the neighbours
ghg = defaultdict(dict)
for r in rows(P / "ghg_secten.csv"):
    ghg[r["sector"]][r["year"]] = round(float(r["value_mt_co2e"]), 1)
ghg_years = sorted(ghg["total_excl_lulucf"])
ghg_m = defaultdict(float)
for r in rows(P / "ghg_monthly.csv"):
    if r["sector"] == "total_excl_lulucf":
        ghg_m[r["month"]] = float(r["value_mt_co2e"])
h1_year = max(m[:4] for m in ghg_m if m.endswith("-06"))
h1 = lambda y: round(sum(ghg_m[f"{y}-{m:02d}"] for m in range(1, 7)), 1)
ghg_eu = defaultdict(dict)
for r in rows(P / "ghg_eu.csv"):
    ghg_eu[r["geo"]][r["year"]] = float(r["value_mt"])
eu_last = max(ghg_eu["FR"])
emissions = {
    "years": ghg_years,
    "provisional": ghg_years[-1],
    **{k: [ghg[k].get(y) for y in ghg_years] for k in ("total_excl_lulucf", "transport", "agriculture", "manufacturing_construction", "buildings", "energy_industry", "waste")},
    "h1": [h1_year, h1(int(h1_year) - 1), h1(h1_year)],
    "euYear": eu_last,
    "euRows": sorted(([g, round((ghg_eu[g][eu_last] / ghg_eu[g]["1990"] - 1) * 100, 1)] for g in ("FR", "DE", "IT", "ES", "BE", "NL", "EU27_2020")), key=lambda x: x[1]),
}

# School spending per secondary student (OECD): neighbours in current USD PPP
# for the latest year, trends at constant prices
sp = defaultdict(dict)
sp_status = {}
for r in rows(P / "school_spending_oecd.csv"):
    if r["level"] == "ISCED11_2_3" and r["usd_ppp_per_student"]:
        sp[(r["country"], r["price_base"])][r["year"]] = round(float(r["usd_ppp_per_student"]))
        if r["price_base"] == "V":
            sp_status[(r["country"], r["year"])] = r["status"]
sp_years = sorted(sp[("FRA", "Q")])
sp_last = max(sp[("FRA", "V")])
spending = {
    "years": sp_years,
    "constant": {c: [sp[(c, "Q")].get(y) for y in sp_years] for c in ("FRA", "DEU", "ESP", "ITA", "OECD")},
    "year": sp_last,
    "rows": sorted(([c, sp[(c, "V")][sp_last], sp_status.get((c, sp_last), "")] for c in ("FRA", "DEU", "ITA", "ESP", "BEL", "NLD", "GBR", "OECD") if sp_last in sp[(c, "V")]), key=lambda x: -x[1]),
}

# Hand-transcribed tables live beside the pipeline's processed data, in its
# versioned reference folder: each row names its document, page and date.
REF = SRC / "reference/data-lab"

# Farm income: Insee's result per worker in constant euros, RICA by farm
# type, Eurostat's Indicator A for the neighbours
farm_fr = defaultdict(dict)
for r in rows(P / "farm_income_fr.csv"):
    farm_fr[r["measure"]][r["year"]] = float(r["value"])
farm_years = sorted(farm_fr["result_per_worker_keur_real"])
farm_type = defaultdict(dict)
for r in rows(P / "farm_income_by_type.csv"):
    if r["rcai_per_worker_keur"]:
        farm_type[r["farm_type"]][r["year"]] = float(r["rcai_per_worker_keur"])
type_years = sorted(farm_type["all"])
farm_eu = defaultdict(dict)
for r in rows(P / "farm_income_eu.csv"):
    farm_eu[r["geo"]][r["year"]] = float(r["index_2020"])
farm_eu_last = max(farm_eu["FR"])
farm = {
    "years": farm_years,
    "perWorker": [round(farm_fr["result_per_worker_keur_real"][y], 1) for y in farm_years],
    "change": [farm_fr["result_per_worker_real_change_pct"].get(y) for y in farm_years],
    "fte": [farm_fr["nonsalaried_fte_k"].get(y) for y in farm_years],
    "typeYears": type_years,
    "types": {t: [farm_type[t].get(y) for y in type_years] for t in ("all", "cereals_oilseeds", "wine", "dairy", "beef", "pigs")},
    "euYear": farm_eu_last,
    "euRows": sorted(([g, farm_eu[g][farm_eu_last]] for g in ("FR", "DE", "IT", "ES", "BE", "NL", "EU27_2020") if farm_eu_last in farm_eu[g]), key=lambda x: -x[1]),
}

# Young people's mental health: hospital stays and ER visits for self-harm by
# age and sex, the 2024 survey, and the latest monthly bulletin (by hand)
hosp = defaultdict(dict)
for r in rows(P / "self_harm_hosp.csv"):
    if r["measure"] == "stays" and r["rate_crude"]:
        hosp[(r["age"], r["sex"])][r["year"]] = round(float(r["rate_crude"]))
hosp_years = sorted(hosp[("all", "all")])
er = defaultdict(dict)
for r in rows(P / "self_harm_er.csv"):
    if r["geo_level"] == "fr" and r["value"]:
        er[(r["age"], r["sex"])][r["year"]] = round(float(r["value"]))
er_years = sorted(er[("all", "all")])
survey = {(r["indicator"], r["age"]): float(r["estimate_pct"]) for r in rows(P / "mental_health_survey.csv") if r["sex"] == "all" and r["estimate_pct"]}
bulletin = [r for r in rows(REF / "mental_health_bulletin.csv") if r["bulletin_no"] == max(x["bulletin_no"] for x in rows(REF / "mental_health_bulletin.csv"))]
mental = {
    "years": hosp_years,
    "hosp": {f"{a}:{x}": [hosp[(a, x)].get(y) for y in hosp_years] for a in ("11-14", "15-17", "18-24", "all") for x in ("female", "male", "all")},
    "erYears": er_years,
    "er": {f"{a}:{x}": [er[(a, x)].get(y) for y in er_years] for a in ("11-14", "15-17", "18-24") for x in ("female", "male", "all")},
    "survey": {
        "thoughts": [survey[("suicidal_thoughts_12m", "18-29")], survey[("suicidal_thoughts_12m", "all")]],
        "depression": [survey[("major_depressive_episode_12m", "18-29")], survey[("major_depressive_episode_12m", "all")]],
    },
    "bulletin": [{k: r[k] for k in ("bulletin_no", "published", "period_covered", "age", "statement_fr", "statement_en", "page", "url")} for r in bulletin],
}

# Teachers: external public recruitment exams (2026 adds up its two formats),
# and DEPP figures transcribed from RERS 2026
EXAMS = ("crpe", "capes", "capet", "caplp", "agregation")
exam = defaultdict(lambda: defaultdict(lambda: [0, 0]))
unfilled = defaultdict(int)
for r in rows(P / "teacher_exams.csv"):
    if r["type"] == "externe" and r["exam"] in EXAMS + ("capeps",) and r["posts"] and r["admitted"]:
        posts, admitted = int(float(r["posts"])), int(float(r["admitted"]))
        acc = exam[r["exam"]][r["session"]]
        acc[0] += posts
        acc[1] += admitted
        # counted exam by exam (and 2026 format by format): a surplus in one
        # exam doesn't fill another's posts
        unfilled[r["session"]] += max(0, posts - admitted)
sessions = sorted(exam["capes"])
rers = rows(REF / "teachers_rers.csv")
rers_v = lambda ind, scope, year: next(float(r["value"]) for r in rers if r["indicator"] == ind and r["scope"] == scope and r["year"] == year)
headcount_years = sorted({r["year"] for r in rers if r["indicator"] == "teachers_headcount"})
hours = {k: sorted((r["year"], float(r["value"])) for r in rers if r["scope"] == "public_secondary" and r["indicator"] == f"hours_not_taught_{k}") for k in ("total", "non_replacement")}
teachers = {
    "sessions": sessions,
    "fill": {e: [round(exam[e][s][1] / exam[e][s][0] * 100, 1) if exam[e][s][0] else None for s in sessions] for e in EXAMS},
    "unfilled": [unfilled[s] for s in sessions],
    "posts": [sum(exam[e][s][0] for e in EXAMS + ("capeps",)) for s in sessions],
    "headcountYears": headcount_years,
    "headcount": [rers_v("teachers_headcount", "public_total", y) + rers_v("teachers_headcount", "private_total", y) for y in headcount_years],
    "hours": hours,
}

# Taxes: Insee's levy rate by tenth (incl. cash benefits in the denominator),
# and the IPP study's top-income rates (by hand, 2016)
tax_rows = [r for r in rows(P / "tax_rate_by_decile.csv") if r["levy"] == "total"]
tax_year = max(r["year"] for r in tax_rows)
tax_groups = [f"D{i}" for i in range(1, 11)] + ["V20", "Ensemble"]
tax_rate = {r["group"]: float(r["levy_rate_incl_benefits_pct"]) for r in tax_rows if r["year"] == tax_year and r["group"] in tax_groups}
ipp = rows(REF / "tax_ipp.csv")
ipp_series = lambda prefix: [(r["group"], float(r["rate_pct"])) for r in ipp if r["definition"].startswith(prefix) and r["group"].startswith("P")]
ipp_with = ipp_series("incl. undistributed profits — Fig. 1b")
ipp_without = ipp_series("excl. undistributed profits — Fig. 1a")
tax = {
    "year": tax_year,
    "rows": [[g, tax_rate[g]] for g in tax_groups],
    "ippGroups": [g for g, _ in ipp_with],
    "ippWith": [v for _, v in ipp_with],
    "ippWithout": [v for _, v in ipp_without],
    "documents": [
        next([r["publication"], r["source_file"]] for r in tax_rows if r["year"] == tax_year),
        ["IPP, note n° 92, « Quels impôts les milliardaires paient-ils ? » (2023)", ipp[0]["url"]],
        ["Assemblée nationale, réponse à la question écrite n° 1212 (2025)", next(r["url"] for r in ipp if r["group"] == "note" and "assemblee" in r["url"])],
    ],
}

# Social fraud, by hand from HCFiPS, CNAF, CNAM, CNAV and Urssaf documents
fraud_rows = rows(REF / "fraud.csv")
fv = defaultdict(dict)
for r in fraud_rows:
    fv[(r["body"], r["measure"])][r["year"]] = float(r["value_meur"])
fraud_years = [str(y) for y in range(2015, 2026)]
fraud = {
    "estimated": fv[("hcfips", "estimated_total")],
    "components": [[k, fv[("hcfips", f"estimated_component_{k}")]["2024"]] for k in ("companies", "claimants", "health_professionals")],
    "detected": fv[("hcfips", "detected")],
    "recovered": fv[("hcfips", "recovered")],
    "years": fraud_years,
    "series": {
        "urssaf": [fv[("urssaf", "redressements_undeclared_work")].get(y) for y in fraud_years],
        "cnam": [fv[("cnam", "detected_and_stopped")].get(y) for y in fraud_years],
        "cnaf": [fv[("cnaf", "detected")].get(y) for y in fraud_years],
    },
    "cnafEstimated": fv[("cnaf", "estimated_total")],
    # every document a figure was read from, once, without our reading notes
    "documents": [[r["document"].split(" – lu via")[0], r["url"]] for i, r in enumerate(fraud_rows) if r["url"] not in {x["url"] for x in fraud_rows[:i]}],
    "cnamEstimated": fv[("cnam", "estimated_total")],
}

# Heatwaves, by hand from Météo-France: days per year and by decade
waves = rows(P / "heatwaves.csv")
wave_years = [str(y) for y in range(1947, int(max(r["year"] for r in waves)) + 1)]
wave_days = defaultdict(int)
for r in waves:
    wave_days[r["year"]] += int(r["days"])
heat = {
    "years": wave_years,
    "days": [wave_days.get(y, 0) for y in wave_years],
    "decades": [[r["decade"], int(r["episodes"]), int(r["days"]), int(r["years_covered"]), float(r["max_indicator_c"])] for r in rows(P / "heatwaves_by_decade.csv")],
    "count": len(waves),
    "longest": max(int(r["days"]) for r in waves),
    "peak": max((float(r["max_indicator_c"]), r["start"] or r["year"]) for r in waves if r["max_indicator_c"]),
    "last": waves[-1]["end"],
}

state = {
    "built": dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"),
    "months": months,
    "hicp": {k: [s.get(m) for m in months] for k, s in sorted(hicp.items())},
    "weeks": weeks,
    "fuel": {p: [oil[("FR", p)].get(w, (None,))[0] for w in weeks] for p in ("diesel", "euro_super_95")},
    "fuelEu": fuel_eu,
    "days": days,
    "diesel": [price["FR"].get(d) for d in days],
    "dieselDep": {g: s[day] for g, s in sorted(price.items()) if g != "FR" and day in s},
    "short": [short["FR"].get(d, (None,))[0] for d in days],
    "shortN": [short["FR"].get(d, (None, None))[1] for d in days],
    "shortDep": {g: s[day][0] for g, s in sorted(short.items()) if g != "FR" and day in s},
    "quarters": quarters,
    "unemp": {a: [unemp[a].get(q) for q in quarters] for a in ("15-24", "all", "50+")},
    "unempDep": dict(sorted(unemp_dep.items())),
    "speeches": speeches,
    "school": school_out,
    "crime": crime,
    "migration": migration,
    "debt": debt,
    "industry": industry,
    "living": living,
    "doctors": doctors,
    "emissions": emissions,
    "spending": spending,
    "farm": farm,
    "mental": mental,
    "teachers": teachers,
    "tax": tax,
    "fraud": fraud,
    "heat": heat,
}

# The map: départements as paths, and the frame of Paris and the petite couronne
geo = json.load(open(P / "ref/geo_dep.json", encoding="utf-8"))


def bbox(d):
    """Bounds of a path made of M/L/H/V/Z commands, absolute or relative."""
    nums, pts, x, y, cmd = [], [], 0.0, 0.0, None
    for token in re.findall(r"[MmLlHhVvZz]|-?\d*\.?\d+(?:e-?\d+)?", d):
        if token.isalpha():
            cmd = token
            continue
        nums.append(float(token))
        if cmd in "Hh":
            x = nums.pop() + (x if cmd == "h" else 0)
        elif cmd in "Vv":
            y = nums.pop() + (y if cmd == "v" else 0)
        elif len(nums) == 2:
            dx, dy = nums
            nums = []
            if cmd in "ml":
                x, y = x + dx, y + dy
            else:
                x, y = dx, dy
            if cmd == "m":
                cmd = "l"
            elif cmd == "M":
                cmd = "L"
        else:
            continue
        pts.append((x, y))
    return min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts)


boxes = [bbox(d) for code, _, d in geo["deps"] if code in ("75", "92", "93", "94")]
pad = 4
paris = [round(min(b[0] for b in boxes) - pad, 1), round(min(b[1] for b in boxes) - pad, 1),
         round(max(b[2] for b in boxes) + pad, 1), round(max(b[3] for b in boxes) + pad, 1)]
geo_out = {
    "source": geo["source"],
    "width": geo["width"],
    "height": geo["height"],
    "insets": [{"name": i["name"], "box": i["box"]} for i in geo["insets"] if i["dep"] != "metro"],
    "paris": paris,
    "deps": geo["deps"],
}

for name, data in (("state.json", state), ("geo.json", geo_out)):
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    print(name, (OUT / name).stat().st_size // 1024, "KB")
print("latest:", months[-1], latest, day, quarters[-1], "· Paris frame", paris)
