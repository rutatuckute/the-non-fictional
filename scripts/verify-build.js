#!/usr/bin/env node
//
// Catches a deploy that would ship stale styles.
//
// Three times now this site has published a build whose HTML pointed at an
// earlier build's stylesheet: the correct CSS was in the deploy, nothing
// failed, and the pages rendered the previous design. It has happened on
// production twice and on a pull request preview, where it survived two
// consecutive builds including one from an empty commit. `gatsby clean` runs
// before every build and does remove public/, so whatever restores the old
// file does it somewhere this repository cannot see.
//
// What can be checked is the outcome. A clean build emits exactly one
// stylesheet and every page links it. More than one means something was
// restored; a page linking anything else means the HTML is stale. Either way
// the build fails here rather than deploying green and serving the wrong CSS.
//
//   npm run verify:build                 after gatsby build, before the deploy
//   npm run verify:build -- --report-only  write the report, never fail
//
// The report is always written to public/_build-verify.txt, which the deploy
// publishes. Netlify's build logs need credentials this repository does not
// have, so that file is the only way to see what a real deploy produced.
//
const fs = require("fs")
const path = require("path")

const PUBLIC = path.join(__dirname, "..", "public")
const STYLESHEET = /^styles\.[a-f0-9]+\.css$/
const REFERENCE = /\/styles\.[a-f0-9]+\.css/g
const REPORT = path.join(PUBLIC, "_build-verify.txt")
const reportOnly = process.argv.includes("--report-only")

const htmlFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return htmlFiles(full)
    return entry.isFile() && entry.name.endsWith(".html") ? [full] : []
  })

// The report has to say which build wrote it. Reading one that turned out to
// be the previous deploy's is exactly the confusion this whole check exists to
// end, and it happened once while writing it.
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
    "This is the stale-bundle failure. Do not deploy it: the pages would",
    "render an earlier build's styles while reporting success. Clear the",
    "build cache and deploy again.",
  ]
  write(detail)
  console.error("\nBuild verification failed.\n")
  detail.slice(2).forEach((line) => console.error(`  ${line}`))
  process.exit(reportOnly ? 0 : 1)
}

if (!fs.existsSync(PUBLIC)) {
  fail(["public/ does not exist — nothing was built."])
}

const emitted = fs.readdirSync(PUBLIC).filter((name) => STYLESHEET.test(name))
const pages = htmlFiles(PUBLIC)

console.log(
  `verify-build: ${emitted.length} stylesheet(s), ${pages.length} page(s) in public/`
)

if (emitted.length === 0) {
  fail(["No stylesheet in public/ — the build emitted none."])
}

if (emitted.length > 1) {
  fail([
    `${emitted.length} stylesheets in public/, expected 1:`,
    ...emitted.map((name) => `  ${name}`),
    "",
    "A clean build emits one. More than one means a previous build's CSS",
    "was restored into the publish directory.",
  ])
}

const [current] = emitted
const stale = new Map()

pages.forEach((file) => {
  const html = fs.readFileSync(file, "utf8")
  const refs = new Set(html.match(REFERENCE) || [])
  refs.forEach((ref) => {
    if (ref !== `/${current}`) {
      const page = path.relative(PUBLIC, file)
      stale.set(ref, [...(stale.get(ref) || []), page])
    }
  })
})

if (stale.size) {
  fail([
    `The build emitted ${current},`,
    "but these pages link a different stylesheet:",
    "",
    ...[...stale.entries()].flatMap(([ref, where]) => [
      `${ref}`,
      ...where.slice(0, 5).map((page) => `  ${page}`),
      ...(where.length > 5 ? [`  …and ${where.length - 5} more`] : []),
    ]),
  ])
}

const summary = `Build verified: ${pages.length} pages, all linking ${current}.`
write(["OK", "", summary])
console.log(summary)
