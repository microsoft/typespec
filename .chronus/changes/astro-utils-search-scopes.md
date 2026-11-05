---
changeKind: feature
packages:
  - "@typespec/astro-utils"
---

Add opt-in prefix-based search backed by Pagefind filters: plain queries search Docs, `api:` searches JS API, and `all:` searches everything. Type `?` to show keyboard-accessible selectors. Results can include section labels.

```astro
<Search scopes />
```
