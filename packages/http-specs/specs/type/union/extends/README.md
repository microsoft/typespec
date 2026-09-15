# Union extends matrix

These scenarios ask how a language represents a constrained union, its base and
variants, and reuse of those variants. `union U extends Base` is a **structural
assignability constraint**. It does not require model inheritance, automatically
include the base, include all descendants, open the union, or change the wire
format. The fixtures intentionally do not enforce proposed nominal restrictions.

## Running a case

Every format interface has `get` and `put` operations with a finite `choice`
path parameter. Call **every** documented choice. GET returns its exact fixture;
PUT requires that exact decoded JSON and returns the same fixture. All successful
responses are 200, with `Content-Type: application/json; charset=utf-8`.
`@scenarioDoc` in the `.tsp` files specifies each selector and JSON body;
[`mockapi.ts`](./mockapi.ts) implements it.

For example, UE01/U maps to
`Type_Union_Extends_DirectInheritance_Untagged_get` and `_put`, with concrete
paths `/type/union/extends/direct-inheritance/untagged/cat` and `/dog`.
The union remains the operation's body/response type; the selector does not narrow
that public type. A `passOnSuccess` scenario requires every concrete endpoint,
not just the first successful variant.

There are **88 format/context groups, 176 scenarios and 370 concrete method/path
endpoints** (185 GET and 185 PUT). Of these, 19 groups / 38 scenarios are matched
without-extends controls. Mock validation proves the wire contract, **not**
generated class identity, type narrowing, union-membership APIs, or restrictions
inherent in a particular language representation.

## Primary coverage

U = untagged JSON; I = inline `@discriminated(#{ envelope: "none" })`;
E = object-envelope `@discriminated`. Checkmarks cover every alternative, in both
directions. Namespace names below follow `Type.Union.Extends`; each format adds
`Untagged`, `Inline`, or `Envelope`, then `get` / `put`.

| ID    | Namespace and purpose                                                                | U                             | I                                        | E                                    |
| ----- | ------------------------------------------------------------------------------------ | ----------------------------- | ---------------------------------------- | ------------------------------------ |
| UE01  | `DirectInheritance`: Cat and Dog directly inherit Named                              | Yes                           | Yes                                      | Yes                                  |
| UE02  | `Structural`: neither variant inherits Named; U also has an overlapping shape        | Yes                           | Yes                                      | Yes                                  |
| UE03  | `SpreadAndIs`: spread and `model is DogShape` variants                               | Yes                           | Yes                                      | Yes                                  |
| UE04  | `Ancestry`: transitive base/intermediate fields and different compatible ancestry    | Yes                           | Yes                                      | Yes                                  |
| UE05  | `SharedSameBase.First/Second`: Cat reused in two unions, same base                   | Both                          | Both, different tags/property names      | Both, different tags/property names  |
| UE06  | `DisjointSameBase.First/Second`: same base, disjoint variant sets                    | Both                          | Both                                     | Both                                 |
| UE07  | `SharedDifferentBases.ByName/ById`: shared model satisfies two different named bases | Both                          | Both, different tags/property names      | Both, different tags/property names  |
| UE08  | `UnionAndDirect`: model reused in union and directly                                 | Yes                           | Yes                                      | Yes                                  |
| UE09  | `ExplicitBase`: base is an explicitly named alternative                              | Yes                           | Yes                                      | Yes                                  |
| UE10  | `ExplicitDefault`: one unnamed default retains unknown tag and modeled data          | N/A, no tag/default semantics | Yes                                      | Deferred, wire semantics unspecified |
| UE11a | `NestedVariant`: nested union alternative and outer sibling                          | Yes                           | N/A, named Union-valued variant rejected | Yes, nested envelopes                |
| UE11b | `UnionConstraint`: named union is the constraint, not an alternative                 | Yes                           | Yes                                      | Yes                                  |
| UE11c | `UnionExpressionConstraint`: `string \| int32` constraint                            | Yes                           | N/A, non-Model variants                  | Yes                                  |
| UE12a | `ClosedScalar`: closed string literals                                               | Yes, JSON strings             | N/A, non-Model variants                  | Yes                                  |
| UE12b | `OpenScalar`: literal plus explicit string branch                                    | Yes, JSON strings             | N/A, non-Model variants                  | Yes                                  |
| UE12c | `EnumConstraint`: enum constraint and both members                                   | Yes, JSON strings             | N/A, non-Model variants                  | Yes                                  |
| UE12d | `ArrayConstraint`: arrays of both model alternatives                                 | Yes, JSON arrays              | Outside inline-object profile; see below | Yes, array payloads                  |
| UE12e | `IntersectionConstraint`: intersection of two named models                           | Yes                           | Yes                                      | Yes                                  |
| UE12f | `TemplateInstance`: concrete named model template instance constraint                | Yes                           | Yes                                      | Yes                                  |

[Model cases](./models.tsp) contain UE01-07/09;
[usage cases](./usage.tsp) contain UE08;
[composition cases](./composition.tsp) contain UE10-11;
[constraint cases](./constraints.tsp) contain UE12.

UE06 declares an additional `Lizard` descendant but does not include it in any
union. Selectors in each context include only that context's fixtures. UE05 uses
the **same Cat model** with `kind: "cat"` versus `petType: "feline"` inline,
and `kind/value` versus `animal/data` envelopes. UE07 independently varies
`kind/value` versus `entityType/entityData` while retaining both `name` and `id`.
UE08 also has `Direct` and `Properties` groups: a direct Cat must have neither
the union's injected discriminator nor its envelope.

### Without-extends controls

[`controls.tsp`](./controls.tsp) retains the matched variant models, tags,
operation shapes and fixture values, but omits union extends clauses. Names add
`Controls` after `Type.Union.Extends`, and routes add `/controls` after
`/type/union/extends`.

| Control                                | Pairing | Formats / contexts                                   |
| -------------------------------------- | ------- | ---------------------------------------------------- |
| C01 `Controls.DirectInheritance`       | UE01    | U/I/E                                                |
| C02 `Controls.Structural`              | UE02    | U/I/E, including U overlap                           |
| C05 `Controls.SharedSameBase`          | UE05    | U/I/E, First and Second                              |
| C10 `Controls.ExplicitDefault`         | UE10    | I only; E deferred with UE10                         |
| C11 `Controls.NestedVariant`           | UE11a   | U/E, nested controls use the controlled inner unions |
| C12 `Controls.ClosedScalar/OpenScalar` | UE12a/b | U/E                                                  |

These are representative controls, not a full second Cartesian product. Missing
controls for other primary rows mean reduced duplication, not compiler N/A.

### Secondary axes

| Namespace    | Coverage                                                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `Nullable`   | U/I/E, outer `U \| null`, both non-null alternatives and actual JSON null; omitted bodies are not null                              |
| `Recursive`  | U/E, finite branch containing leaf, plus standalone leaf                                                                            |
| `Conversion` | U/I/E plus direct Data; inherited `display_name`, Unix timestamp `1704067200` (2024-01-01T00:00:00Z), base64url `-_8` (bytes FB FF) |

Versioning and malformed/missing-tag resilience are deferred. Wrong closed-union
tags are not defined as valid service responses. Request rejection checks enforce
the authored fixtures; they do not introduce new resilience scenarios.

## Excluded or unresolved combinations

- Direct/aliased anonymous model-expression bases are compiler-invalid. Use
  declared named bases instead; intersections and named template instances have
  separate valid coverage. See the compiler's
  [union constraint tests](../../../../../compiler/test/checker/union.test.ts).
- Named non-Model variants in inline unions are rejected by the
  [discriminator helper](../../../../../compiler/src/core/helpers/discriminator-utils.ts).
  Arrays are compiler Models, so **inline arrays are not labeled
  compiler-invalid**. They are outside this inline-object wire profile and need
  a separate wire design.
- Object-envelope defaults, including their no-extends control, are **deferred
  because their wire semantics are unspecified**, not a normative prohibition.
  [OpenAPI 3.2's envelope branch](../../../../../openapi3/src/schema-emitter-3-2.ts)
  explicitly says default handling with envelopes is not yet specified; the
  [parent schema emitter](../../../../../openapi3/src/schema-emitter.ts) currently
  wraps named variants only. That omission alone does not establish whether a
  default should represent the payload or the complete envelope.

**Open design question:** For an object-envelope default, does the default type
describe the complete unknown envelope or only its payload, and how should its
union constraint apply? No guessed wire fixture is included.

UE10 inline has `UnknownInline extends Named { kind: string; extra:
Record<unknown> }` as its single unnamed default. It retains `kind: "dragon"`,
the required base `name`, and all nested `extra` data. This is different from
UE09's named `base` alternative and from opening a closed union by implication.

## Scoped feature configuration

Only this folder opts into `union-extends` via its project `tspconfig.yaml`.
Spector resolves nearest/inherited config for both scenario and mock validation;
configured imports and linter settings are honored. Validation still forces
no-emit and warnings-as-errors, with configured emitters disabled. The existing
empty http-specs package config stops lookup for ordinary sibling scenarios.
