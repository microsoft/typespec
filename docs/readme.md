## Docs moved

Docs have moved into the website folder [../website/src/content/docs/docs](../website/src/content/docs/docs)

### For reference

This is an unfortunate current limitation of astro starlight. If things change in the future this is the current limitations:

- content folder MUST be under the astro website package(default src/content)
- astro allows symlink but it MUST be the whole collection(e.g. `src/content/docs`)
- starlight only way to put docs under a `docs/` path is to have another `docs/` folder under the collection one `src/content/docs` (resulting in `src/content/docs/docs`)

If any of the issues above is improve we could potentially move the docs back here or reduce at least some nesting
