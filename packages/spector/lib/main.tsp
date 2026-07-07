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
 * A single language-agnostic assertion about the generated SDK surface — a
 * property of the emitted client (or service) code that is invisible on the
 * wire (naming, access, inheritance reshaping, operation location, ...). The
 * `doc` states the intent in plain, language-neutral terms; the remaining
 * fields carry the machine-checkable expectation that a per-emitter verifier
 * (or, as a fallback, AI) validates against the generated code.
 */
model SurfaceCheck {
  /**
   * The kind of surface assertion, used to route the check to a verifier —
   * e.g. `naming`, `access`, `hierarchy`, `client-location`, `exactName`.
   */
  category: string;

  /** Language-agnostic description of the expected surface. */
  doc: string;

  /** Expected client-facing identifier (`naming` / `exactName` checks). */
  expected?: string;

  /**
   * Symbol kind for casing-aware `naming` checks, so each emitter can recast
   * the expected identifier into its idiomatic casing — one of `enum`,
   * `model`, `property`, `parameter`, `operation`, `enumvalue`.
   */
  kind?: string;

  /** Expected base type on the client surface (`hierarchy` checks). */
  expectedBase?: string;

  /** Client the operation should be surfaced on (`client-location` checks). */
  expectedClient?: string;

  /** Client the operation should be absent from (`client-location` checks). */
  absentFrom?: string;

  /** Whether the target should be hidden from the public surface (`access` checks). */
  internal?: boolean;
}

/**
 * Describe one or more expected properties of the **generated SDK surface** for
 * this element — things a wire test can't see, such as a client rename, an
 * access change, or a reshaped inheritance hierarchy. A single `@surfaceDoc`
 * may carry multiple checks (e.g. an element that is both made internal and
 * renamed). The description is stated once, language-agnostically; each emitter
 * validates it against its own generated code. Mirrors `@scenarioDoc`, but for
 * the surface instead of the wire.
 * @param checks The surface assertions to validate for this element.
 */
extern dec surfaceDoc(
  target: Namespace | Interface | Operation | Model | Enum | Union | ModelProperty | EnumMember | UnionVariant,
  checks: valueof SurfaceCheck[]
);
