# Client-shaping decorator rules

How to turn a TypeSpec client-shaping decorator into a client-surface
expectation. **The spec is the source of truth**; these rules just say how to
read it. Apply them together with the language's `context.md` (which says where
symbols live and what casing the emitter applies by default). One small file,
language-agnostic, written once — adding a scenario needs no changes here.

## `@clientName(name)` / `@clientName(name, "<language>")`
The client surface must expose this symbol under `name`. If a language-scoped
override matches the language being checked, use that name; otherwise use the
unscoped name. Comparison is **casing/separator-insensitive**: the rename must
have taken effect, but idiomatic casing per the language's conventions is
expected and fine (`clientName` → Python `client_name`, C# `ClientName`,
`ClientEnumValue1` → Python `CLIENT_ENUM_VALUE1`).
Applies to: models, enums, unions, properties, enum members, operations,
parameters, headers.

## `@clientName(exact(name))`
The generated identifier must equal the symbol's spec name **byte-for-byte**,
with NO casing transform applied. This is the one case where the language's
default casing must be suppressed.

## `@clientLocation(target)`
The operation must be reachable on the client / operation group named by
`target`, not on its original client. Verify the method exists there.

## `@access("internal" | "public")`
The symbol's generated visibility must match — e.g. in Python, an `internal`
symbol is prefixed with `_` and/or absent from the public `__init__` exports.

## `@flattenProperty`
The nested model's properties must appear inlined on the parent's client
surface rather than nested under the original property.

## Wire name (for locating, not a check)
A property's wire/serialized name is its spec name unless overridden by
`@encodedName("application/json", "<wire>")`. Use the wire name only to find the
right property; the **client identifier** is what you verify.

## No client-shaping decorator
Skip it — the wire test already covers it. A client check there would be noise.

---

When you meet a decorator not listed here, don't guess: report it as
"unknown decorator, not checked" so a human can add a rule above or a
hand-written row in `criteria.md`.
