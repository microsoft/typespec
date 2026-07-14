import "../dist/src/lib/tsp-index.js";

using TypeSpec.Reflection;

namespace TypeSpec.Spector;

alias ScenarioServiceOptions = {
  /**
   * Version enum that would be used on the $versioned decorator
   */
  versioned?: Enum;
};

/**
 * Setup the boilerplate for a scenario service(server endpoint, etc.)
 */
extern dec scenarioService(
  target: Namespace,
  route: valueof string,
  options?: ScenarioServiceOptions
);

/**
 * Mark an operation, interface or namespace as a scenario. All containing operations will be part of the same scenario.
 */
extern dec `scenario`(target: Namespace | Interface | Operation, name?: valueof string);

/**
 * Specify documentation on how to implement this scenario.
 * @param doc Documentation
 * @param formatArgs Format arguments
 */
extern dec scenarioDoc(
  target: Namespace | Interface | Operation,
  doc: valueof string,
  formatArgs?: Model
);

/**
 * The category of a client-surface check: what kind of generated-surface
 * property is being asserted. This is an **extensible** union — the named
 * members are the canonical, tight set every emitter understands, but any
 * string is accepted so a new category can be introduced without changing this
 * core library. A category an emitter hasn't onboarded a verifier for simply
 * falls back to being verified against the prose (AI), exactly like `other`.
 *
 * Each category fixes what `subject` and `expected` mean:
 *
 * | category         | `subject` is…                | `expected` is…                                   |
 * | ---------------- | ---------------------------- | ------------------------------------------------ |
 * | `naming`         | renamed type/member/op/param | canonical client identifier (recast per language) |
 * | `access`         | type/operation               | `"internal"` or `"public"`                        |
 * | `clientLocation` | operation                    | client/group name it should be surfaced on        |
 * | `hierarchy`      | derived model                | base type's client name                           |
 * | `flatten`        | the flattened property       | promoted property name(s); blank = just inlined   |
 * | `paging`         | operation                    | item/element type the pager yields                |
 * | `other`          | anything                     | free-form; verified against the prose (AI)        |
 */
union SurfaceCategory {
  string,

  /** Client-facing identifier of `subject` (recast to the language's idiomatic casing). */
  naming: "naming",

  /** Public vs internal visibility of `subject` on the client surface. */
  access: "access",

  /** Which client or operation group an operation is surfaced on. */
  clientLocation: "client-location",

  /** Base type `subject` extends on the client surface. */
  hierarchy: "hierarchy",

  /** Nested model properties inlined onto the parent model. */
  flatten: "flatten",

  /** `subject` surfaces as a pageable collection of an item type. */
  paging: "paging",

  /** No mechanical rule — verified against the prose (AI residual). */
  other: "other",
}

/**
 * Describe one expected property of the **generated SDK surface** — something a
 * wire test can't see, such as a client rename, an access change, an operation
 * relocated to another client, or a reshaped inheritance hierarchy. Mirrors
 * `@scenarioDoc`, but for the surface instead of the wire.
 *
 * To keep surface checks deterministic and grounded in a real scenario,
 * `@surfaceDoc` may only be applied to an element that also carries
 * `@scenarioDoc` (a `@scenario` namespace/interface/operation). The check itself
 * is fully explicit: the author states the `category`, the `subject` the check
 * is about (a type/member reference — which may differ from the annotated
 * operation), and the `expected` client-surface output. Nothing is inferred from
 * other decorators, so adding or reading a check needs no knowledge of the
 * client-generator vocabulary.
 *
 * The precompute step (`listSurfaceDocs`) records these language-agnostically;
 * each emitter's `verifiers.json` decides how to check a category using the
 * generic `{target}` (subject name), `{expected}`, `{kind}` (subject kind) and
 * `{origin}` (subject's declaring container) placeholders. A category with no
 * verifier for an emitter is verified against the prose by AI — so introducing a
 * new category never requires any emitter to change.
 *
 * By default `expected` is a single canonical, language-agnostic string and each
 * emitter recasts it to its idiomatic form (e.g. `{expected:byKind}`). When a
 * name can't be derived by casing (a reserved-word escape, an acronym, a hard
 * rename), pass a **dict mapping scope → exact value** instead — keyed the same
 * way the client-generator decorators are scoped (`"python"`, `"python,csharp"`,
 * `"!java"`). A dict value is matched **verbatim** for its scope; a language not
 * listed in the dict is not checked.
 *
 * ```tsp
 * // idiomatic: one canonical name, every emitter recasts it
 * @surfaceDoc("naming", widgetName, "widgetName")
 *
 * // exact per language: each scope matched verbatim
 * @surfaceDoc("naming", ioThing, #{ python: "io_thing", csharp: "IOThing" })
 * ```
 *
 * @param category The kind of surface assertion. See {@link SurfaceCategory}.
 * @param subject The type or member the check is about (may differ from `target`).
 * @param expected The expected client-surface output: a single string (recast per
 *   language) or a `scope → value` dict (each value matched verbatim for its scope).
 * @param doc Optional extra natural-language description. Markdown.
 */
extern dec surfaceDoc(
  target: Namespace | Interface | Operation,
  category: valueof SurfaceCategory,
  subject: unknown,
  expected: valueof string | Record<string>,
  doc?: valueof string
);
