# Decap (Netlify) CMS — retired

These are the files that ran the old CMS, kept verbatim for reference.

They are no longer served. Two reasons they could not stay at `/admin`:

- the `git-gateway` backend in `config.yml` is Netlify Identity, which does not
  exist off Netlify, so the panel could not authenticate anywhere else;
- `/admin` is now the Payload admin panel, and a file in `public/admin/` would
  shadow that route.

The collections and field definitions in `config.yml` are what the Payload
collections in `src/collections/` were modelled on — the field names and the
`select` option lists were carried across unchanged.
