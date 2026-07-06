# AGENTS.md

## Project Context

- This is a personal Gatsby website written in JavaScript.
- The site is deployed through Netlify from GitHub.
- The production branch for this repository is `master`, not `main`.

## Change Guidelines

- Do not push directly to `master`; create a branch and open a pull request against `master`.
- Preserve existing content, URLs, and the general visual identity unless explicitly asked to change them.
- Prefer small, focused pull requests with a clear purpose.
- Avoid unnecessary dependencies.

## Validation

- Run `npm run build` before finishing.
- For responsive design work, check the site at 320px, 375px, 768px, 1024px, and 1440px widths.
- Avoid horizontal scrolling on mobile.
- Avoid fixed-width containers that overflow.

## Pull Request Notes

Every pull request should include:

- Summary
- Changed files
- Assumptions
- Remaining limitations
