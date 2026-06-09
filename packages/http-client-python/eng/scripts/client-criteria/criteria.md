# Client criteria — hand-written

Most criteria are derived automatically from the spec by `/generate-criteria`
(into `criteria.generated.md`). This file is only for cases the derivation
can't infer from a single decorator — leave it empty until you hit one.

`/check-client-criteria` merges this file with `criteria.generated.md`; on an id
collision, the row here wins (so you can override a derived row).

Use a hand-written row when:

- the expectation is structural or holistic, not a name (e.g. "the paged op
  returns a lazily-iterated collection") — use kind `custom`;
- it depends on several decorators interacting in a non-obvious way;
- you want to override or correct a derived row.

Format (same columns as the generated file):

| id  | scenario | kind | target | expected |
| --- | -------- | ---- | ------ | -------- |

<!-- Example of a complex, hand-written case (delete or adapt):
| structure::paged-list | paging | custom | the list operation surfaces results as a lazily-iterated pageable, not a single response object | a pageable/iterator type |
-->
