# Client Criteria Checker — context (http-client-python)

You are inspecting generated Python client SDKs to verify **client-surface**
behavior that the spector wire tests cannot see. A property renamed with
`@clientName`, an enum member preserved with `@exactName`, or a method relocated
with `@clientLocation` all send identical bytes on the wire — the mock APIs pass
them either way. Your job is to check how the generated client actually _looks_.

## Your job

For each criterion you are given, **locate the corresponding symbol in the
generated code and report its exact identifier.** Nothing more. Do not judge
whether it is correct or idiomatic — a deterministic step compares the
identifier you report against a human-authored expected value. This split means
a mistaken opinion can't produce a false pass.

## Where the code is

Generated packages live at `tests/generated/<flavor>/<package>/`, one package
per spector spec. The two flavors differ only in their runtime imports:

- **azure** — imports from `azure.core` (e.g. `azure.core.rest`, `_model_base`).
- **unbranded** — imports from `corehttp` instead.

Symbol locations are the same across flavors.

## Where each symbol lives

- **Enum** `Foo` → class `Foo` in `<root_module>/models/_enums.py`.
  - Each member is `IDENTIFIER = "<wire value>"`.
  - The **client identifier** is the attribute name (left of `=`).
  - The **wire value** is the string literal (right of `=`).
- **Model** `Foo` → class `Foo` in `<root_module>/models/_models.py`.
  - Each property is `prop_name: <type> = rest_field(name="<wire name>")`.
  - The **client identifier** is the attribute name.
  - The **wire name** is the `name=` argument to `rest_field(...)`. If absent,
    the wire name equals the attribute name.
- The package's top-level `__init__.py` re-exports the public symbols; start
  there if unsure of the module layout.

## What the emitter does to names by default

Knowing the default transform lets you tell when a check's intent was honored vs
silently lost:

- **Enum members** → upper `SNAKE_CASE` (`aBc` would normally become `A_BC`).
- **Properties / parameters / methods** → `snake_case`.
- **Classes / enums** → `PascalCase`.

So an `@exactName` member of `aBc` is correct only if it appears literally as
`aBc`; seeing `A_BC` means the default normalization was applied and the intent
was lost. A `@clientName("modelType")` property is correct if you see
`model_type` (rename applied, then idiomatic casing); seeing the old wire name
means the rename was dropped.

## Output contract

Respond with **only** this JSON object — no prose, no markdown fences:

```
{"found": <bool>, "identifier": <string|null>, "file": <string|null>, "evidence": <string|null>}
```

`evidence` is the single line of code you read the identifier from. If you can't
find the symbol, return `found: false` with the rest null.
