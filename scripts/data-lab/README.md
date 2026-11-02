# Data Lab — France

The data behind `/projects/france-data-lab/`. It comes from the data pipeline in
the `the-non-fictional-data-stories` repository (`france-protests-story/`),
which fetches and cleans every source. This folder only exports what the page
shows into `src/components/data-lab/data/`:

- `state.json`: the series for "The state of things": inflation (Eurostat
  HICP), fuel prices at the pump since 2005 and in the neighbouring countries
  (EU Weekly Oil Bulletin), daily diesel prices and shortages by station
  (prix-carburants), unemployment by age and by département (Insee), lycée
  teaching groups (DEPP), recorded violence (SSMSI), residence permits,
  asylum and removals (Eurostat) with the immigrant population (Insee),
  public debt (Insee, Eurostat), industrial jobs (Insee), standard of living
  by activity status (Insee), GP density and accessibility (DREES),
  greenhouse gas emissions (Citepa, Eurostat), spending per pupil (OECD), and
  the government statements matched to each topic (vie-publique.fr).
- `geo.json`: the départements as SVG paths on a 1000-wide plane, from IGN
  ADMIN EXPRESS COG-CARTO 2026 (Licence Ouverte), with the overseas insets
  and the frame of the Paris close-up.

To refresh after the pipeline has run:

    python3 scripts/data-lab/export-state.py ../../the-non-fictional-data-stories/repo/france-protests-story

The texts behind the squares of "What is said" (every question to the
government, government statement and fact-checked claim, per topic; the
fact-checks cleaned and merged, without verdicts):

    python3 scripts/data-lab/export-texts.py ../design/france-data-lab/questions

It writes the counts to `src/components/data-lab/data/texts.json` and one
file per topic to `public/data-lab/texts/`, fetched when the reader reaches
the squares.

The claims behind each question are kept by hand in
`src/components/data-lab/origins.js`.
