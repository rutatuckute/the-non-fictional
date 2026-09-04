#!/usr/bin/env node
//
// Catches a deploy that would ship stale styles.
//
// Three times this site has published a build whose HTML pointed at an earlier
// build's stylesheet: the correct CSS in the deploy, nothing failing, and the
// pages rendering the previous design. Twice on production, once on the
// preview for pull request #42, where it outlasted two consecutive builds
// including one from an empty commit, so a week of work could not be reviewed
// until it was already live.
//
// The publish directory is not the place to look. A Netlify build ends with
// three stylesheets in public/ — this one and two from earlier deploys — and
// deleting the directory first changes nothing: all three come back, written
// within a hundred milliseconds of each other, after `rm -rf public .cache`
// has already run. Whatever puts them there is beyond anything this file can
// reach, and the newest of the three by modification time is not even the
// right one, so counting files and comparing timestamps both mislead.
//
// webpack.stats.json is written by this build and names the stylesheet this
// build emitted. That is the only trustworthy answer to "which one is
// current", and every page must link it. Strays alongside it are harmless for
// as long as nothing points at them.
//
//   npm run verify:build                   fail the build if a page is stale
//   npm run verify:build -- --report-only  write the report, never fail
//
// The report is always written to public/_build-verify.txt, which the deploy
// publishes, stamped with the commit that produced it. Netlify's build logs
// need credentials this repository does not have, so that file is the only way
// to see what a real deploy did.
//
const fs = require("fs")
const path = require("path")

const PUBLIC = path.join(__dirname, "..", "public")
const STATS = path.join(PUBLIC, "webpack.stats.json")
const REPORT = path.join(PUBLIC, "_build-verify.txt")
const STYLESHEET = /styles\.[a-f0-9]+\.css/
const REFERENCE = /\/styles\.[a-f0-9]+\.css/g
const reportOnly = process.argv.includes("--report-only")

const stamp = [
  `commit:  ${process.env.COMMIT_REF || "unknown"}`,
  `context: ${process.env.CONTEXT || "local"}`,
  `built:   ${new Date().toISOString()}`,
  "",
]

const write = (lines) => {
  try {
    fs.writeFileSync(REPORT, [...stamp, ...lines].join("\n") + "\n")
  } catch (error) {
    console.error(`Could not write ${REPORT}: ${error.message}`)
  }
}

const fail = (lines) => {
  const detail = [
    "FAILED",
    "",
    ...lines,
    "",
    "Do not deploy this: the pages would render an earlier build's styles",
    "while the deploy reported success. Clear the build cache and retry.",
  ]
  write(detail)
  console.error("\nBuild verification failed.\n")
  detail.slice(2).forEach((line) => console.error(`  ${line}`))
  process.exit(reportOnly ? 0 : 1)
}

const htmlFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return htmlFiles(full)
    return entry.isFile() && entry.name.endsWith(".html") ? [full] : []
  })

if (!fs.existsSync(PUBLIC)) {
  fail(["public/ does not exist — nothing was built."])
}

if (!fs.existsSync(STATS)) {
  fail([
    "public/webpack.stats.json is missing, so there is no way to tell which",
    "stylesheet this build emitted. The build did not finish as expected.",
  ])
}

// Every chunk names the same stylesheet, but read them all rather than trust
// one: more than one distinct name would mean this no longer identifies a
// single current stylesheet, and the check should say so rather than quietly
// pick whichever came first.
const stats = JSON.parse(fs.readFileSync(STATS, "utf8"))
const named = new Set(
  Object.values(stats.assetsByChunkName || {})
    .flatMap((assets) => (Array.isArray(assets) ? assets : [assets]))
    .map(String)
    .filter((asset) => STYLESHEET.test(asset))
)

if (named.size !== 1) {
  fail([
    `webpack.stats.json names ${named.size} stylesheets, expected 1:`,
    ...[...named].map((name) => `  ${name}`),
  ])
}

const [current] = [...named]
const pages = htmlFiles(PUBLIC)
const stale = new Map()

pages.forEach((file) => {
  const html = fs.readFileSync(file, "utf8")
  new Set(html.match(REFERENCE) || []).forEach((ref) => {
    if (ref !== `/${current}`) {
      const page = path.relative(PUBLIC, file)
      stale.set(ref, [...(stale.get(ref) || []), page])
    }
  })
})

if (stale.size) {
  fail([
    `This build emitted ${current},`,
    "but these pages link something else:",
    "",
    ...[...stale.entries()].flatMap(([ref, where]) => [
      ref,
      ...where.slice(0, 5).map((page) => `  ${page}`),
      ...(where.length > 5 ? [`  …and ${where.length - 5} more`] : []),
    ]),
  ])
}

// Strays are normal on Netlify and harmless while unreferenced, so they are
// recorded rather than treated as a failure.
const strays = fs
  .readdirSync(PUBLIC)
  .filter((name) => STYLESHEET.test(name) && name !== current)

const summary = [
  "OK",
  "",
  `${pages.length} pages, all linking ${current}.`,
  ...(strays.length
    ? [
        "",
        `${strays.length} unreferenced stylesheet(s) also in public/:`,
        ...strays.map((name) => `  ${name}`),
        "Expected on Netlify; harmless while nothing links them.",
      ]
    : []),
]
write(summary)
console.log(summary.join("\n"))
