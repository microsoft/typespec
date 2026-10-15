# Public JavaScript documentation ratchet

`pnpm check:public-jsdoc` rejects new undocumented public API identities. The root
`check:eng` (also run by `build`) includes it. Run after installing workspace
dependencies; package builds are not required.

The check discovers non-private `packages/*` manifests, their actual `exports`
conditions, or `types`/`main` for packages without an exports map. It checks testing,
experimental, typekit, and language-component subpaths, not just `src/index.ts`.
Exactly these client emitters are excluded:

- `@typespec/http-client-csharp`
- `@typespec/http-client-java`
- `@typespec/http-client-js`
- `@typespec/http-client-python`

The shared `http-client` library and all `emitter-framework` subpaths remain included.
Routes with an `internals` segment and non-JavaScript assets (CSS, JSON, TypeSpec)
are excluded. Unknown target formats and wildcard exports require an explicit
mapping rather than silently reporting no APIs.

## What is checked

Existing API Extractor and TypeDoc integrations select a root entry (and the
API-model helper only one typekit entry). They cannot supply this published-subpath
ratchet. This script uses the existing TypeScript dependency and compiler options,
mapping compiled targets back to their sources without depending on stale builds.
Each entry/conditional source gets its own program. Only its real imports and
configured ambient declarations participate; sibling entry points cannot inject
unrelated module augmentations. Vite packages also load Vite's asset declarations
for CSS and worker imports.

The checker resolves aliases and follows the semantic public type graph:
named types, object/enum members, static and instance class members, all overloads'
parameter/return types, generic containers, constraints, defaults, and index types.
It follows type predicates, inherited base contracts and conditional result branches.
Documentation is deduplicated by declaration, independently from semantic traversal
of each concrete type instance. For example, visiting `Box<string>` must not hide
an undocumented type exposed later through `Box<Metadata>`. Generic aliases are
followed through their resolved members/signatures, not by blindly traversing alias
arguments that a mapped type may omit.
Fresh bound parameters recreated by recursive generic methods are memoized by
declaration, constraint and default, not by their transient TypeScript object IDs.
Top-level standard-library `Extract`/`Exclude` filter fields that repeat an existing
payload member are not separate member-summary obligations. Newly introduced or
nested filter fields are not exempted, and resolved value types still participate
in traversal.
Mapped types expose their resolved properties, not every syntactic type argument:
`Omit<Helper, "implementationDetail">` does not expose the omitted member or require
the helper's own summary. Loaded module augmentations are also checked. Workspace
types reached through another package are checked, not silently treated as external
dependencies; third-party and platform declarations are not documentation-owned here.

Public bindings, named types and members need a non-empty summary. Documentation
inherited from base members and resolvable `@inheritDoc` links is accepted. Parameter
tags and separate prose for every overload are not required. Private/protected
members, private identifiers, and declarations tagged `@internal`, `@private` or
`@hidden` (including members of excluded declarations) are not checked.

This is a source-level summary-presence check, not a prose-quality, packaging or
declaration-compatibility validator. It does not require summaries on parameters,
type parameters, constructors, or anonymous call/index signatures themselves, but
does follow their exposed types. Existing package builds remain responsible for
general type errors. Unresolved imports or error types that could erase the
public graph fail the check. Excessively deep graph expansion also fails explicitly
rather than silently truncating the public graph.

## Packaging exceptions

Exact target-keyed exceptions in the script make the existing packaging defects
visible. They are **not** documentation-complete entries:

- `@typespec/tspd` root: no root source/index artifact exists; the ref-doc subpaths
  are checked normally.
- `@typespec/protobuf/testing`: no testing source entry exists.
- `@typespec/http-specs` root: a scenario/data package without a root JS module.

Explicit source overrides cover the compiler module-resolver's mismatched `types`
path, HTML viewer's separately bundled emitter root, and the formatter's `.mjs`
wrapper. The wrapper is checked rather than dropping this package.
Exceptions are pinned to manifest targets and become errors when obsolete.
New unresolved mappings, including a new source-less package root, fail.
Containment and ownership comparisons normalize TypeScript/native separators and
filesystem case sensitivity. Serialized identities remain source-relative with
forward slashes on Windows as well as Unix.

## Retiring existing debt

`eng/common/config/public-jsdoc-baseline.json` is an explicit generated list of
existing gaps, **not** a permitted count. Identities combine package, public subpath,
export binding or source-module/qualified symbol/member. Computed member names use
their source spelling, not TypeScript's generated symbol IDs. Shared workspace
types reached through foreign packages use a canonical `(exposed type)` identity
to avoid multiplying identical debt across every consuming package.
Static class members use a `static ` name qualifier, including in ancestor names
for nested parameter/return types. For example, `VersionMap.static getVersions`
cannot consume debt for the instance member `VersionMap.getVersions`. Instance
identities are unchanged, and inherited summaries follow the matching receiver.

After documenting or removing APIs, run:

```sh
pnpm check:public-jsdoc --prune
```

This only removes resolved debt; it refuses to add any new gap. Commit the smaller
baseline with the documentation. The normal check rejects stale debt to prevent a
fixed API from being silently reintroduced undocumented. Moving/renaming a module,
export, type, or member can change its identity: document the replacement instead
of transferring a debt allowance.

The initial inventory is deliberately reproducible:

```sh
pnpm check:public-jsdoc --update-baseline
```

This command can add debt and is **not** the routine fix for a failing check.
Review every new identity if deliberately rebasing the initial debt inventory.
The baseline includes route-specific exposure and shared signature types, so its
length is not a count of unique undocumented source declarations.
