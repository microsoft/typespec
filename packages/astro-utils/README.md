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
