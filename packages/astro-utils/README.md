# TypeSpec Astro Utils

This is a bunch of tools for various components of astro(shiki, starlight, expressive code) that is shared across typespec.io and azure.github.io/typpespec-azure website.

**DO NOT PUBLISH**

## Search

Use the shared Pagefind modal search in a Starlight site's header:

```astro
---
import Search from "@typespec/astro-utils/components/search.astro";
---

<Search />
```

Keep Starlight's `pagefind` integration enabled (the default) to generate the index and
Component UI assets during `astro build`. Search works in the built site and `astro preview`;
development mode renders a disabled control without loading search assets.

The component uses the site's base path, Fluent theme tokens, and Starlight search labels
(with English defaults on non-Starlight pages). It supports Up/Down result navigation and
Enter activation, and avoids favoring short generated API pages over longer documentation.

### Search scopes

Use `<Search scopes />` for prefix-based search:

| Query                   | Scope          |
| ----------------------- | -------------- |
| `versioning`            | Docs (default) |
| `api: getHttpOperation` | JS API         |
| `all: versioning`       | All            |

Type `?` to show the selectors, then click one or use Up/Down and Enter to choose.
Prefixes are case-insensitive and only recognized at the start of the query;
decorator queries such as `@route` remain documentation searches.
The visible input keeps the prefix while Pagefind searches the remaining text using
native filters. Sites without the `scopes` prop retain unfiltered search.

Tag each indexed page with `data-pagefind-filter="search-scope:Docs"` or
`data-pagefind-filter="search-scope:JS API"`. Use generated pages' `jsApi` frontmatter
to classify JavaScript API pages, keeping language and decorator references in Docs.
Pages without either filter are only included in All.

Optionally add a result label using metadata:

```html
<meta data-pagefind-meta="searchContext[content]" content="HTTP · Docs" />
```
