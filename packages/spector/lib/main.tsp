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
 * `@surfaceDoc` may only be applied to an element that also carries
 * `@scenarioDoc`, so every surface check is grounded in a documented scenario.
 * Like `@scenarioDoc`, each target gets exactly one `@surfaceDoc`.
 *
 * ```tsp
 * @surfaceDoc(widgetName, #{
 *   category: "naming",
 *   expected: "widgetName",
 * })
 * ```
 *
 * `expected` is a single canonical, language-agnostic string by default, recast
 * by each emitter. For exact per-language names, pass a `scope → value` dict:
 *
 * ```tsp
 * @surfaceDoc(ioThing, #{
 *   category: "naming",
 *   expected: #{ python: "io_thing", csharp: "IOThing" },
 * })
 * ```
 */
auto dec surfaceDoc(
  target: Namespace | Interface | Operation,
  subject: unknown,
  check: valueof {
    category: SurfaceCategory,
    expected: string | Record<string>,
    doc?: string,
  }
);
