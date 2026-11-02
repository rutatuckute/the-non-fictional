// Numbers, dates and words in the reader's language. Dates are calendar days
// and are read in UTC, so the server and the browser print the same thing.
export const makeFormat = lang => {
  const locale = lang === "fr" ? "fr-FR" : "en-GB"
  const fr = lang === "fr"
  const num = (v, opts) =>
    v == null ? "—" : new Intl.NumberFormat(locale, opts).format(v)
  const fixed = (v, d) =>
    num(v, { minimumFractionDigits: d, maximumFractionDigits: d })
  const date = (iso, opts = { day: "numeric", month: "short" }) =>
    new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...opts }).format(
      new Date(`${iso}T00:00:00Z`),
    )
  return {
    lang,
    // A pair is [French, English]. French takes a narrow no-break space before
    // ? ! : ; and inside guillemets, as French typesetting does.
    L: pair =>
      fr ? pair[0].replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« ") : pair[1],
    num,
    pct: (v, d = 1) => (v == null ? "—" : fixed(v, d) + (fr ? " %" : "%")),
    eur: v => (v == null ? "—" : fr ? `${fixed(v, 2)} €` : `€${fixed(v, 2)}`),
    date,
    month: m => date(`${m}-01`, { month: "short", year: "numeric" }),
    quarter: q => q.replace("-Q", fr ? " T" : " Q"),
  }
}
