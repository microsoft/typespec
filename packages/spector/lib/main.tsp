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
 * An explicit surface check supplied directly on `@surfaceDoc`, for the cases
 * the automatic decorator-based derivation can't infer (e.g. a bespoke
 * category, or extra routing detail on top of a derived check). It is merged
 * with the derived checks: when its `category` matches a derived check the
 * provided fields override that check, otherwise it is added as an extra check.
 */
model SurfaceCheckInfo {
  /** Category that routes the check to a verifier (e.g. `naming`, `paging`). */
  category: string;
  /** Expected client-facing identifier (`naming`). */
  expected?: string;
  /** Symbol kind for casing-aware `naming` checks (e.g. `model`, `enum`). */
  kind?: string;
  /** Expected base type on the client surface (`hierarchy`). */
  expectedBase?: string;
  /** Client the operation should be surfaced on (`client-location`). */
  expectedClient?: string;
  /** Client the operation should be absent from (`client-location`). */
  absentFrom?: string;
  /** Whether the target should be hidden from the public surface (`access`). */
  internal?: boolean;
}

/**
 * Describe, in plain natural language, one or more expected properties of the
 * **generated SDK surface** for this element — things a wire test can't see,
 * such as a client rename, an access change, an operation relocated to another
 * client, or a reshaped inheritance hierarchy. Mirrors `@scenarioDoc`, but for
 * the surface instead of the wire.
 *
 * The prose states intent once, language-agnostically. The precompute step
 * (`listSurfaceDocs`) additionally inspects the element's own decorators (e.g.
 * `@list`, `@clientName`, `@access`, `@clientLocation`, `@hierarchyBuilding`) to
 * derive the machine-checkable, routable fields of each check — so an author
 * typically just writes the sentence and applies the normal decorator. A
 * property with no recognized decorator becomes an AI-verified check against the
 * prose, unless an explicit `check` is supplied.
 *
 * @param doc Natural-language description of the expected surface. Markdown.
 * @param check Optional explicit check for detail the derivation can't infer.
 */
extern dec surfaceDoc(
  target: Namespace | Interface | Operation | Model | Enum | Union | ModelProperty | EnumMember | UnionVariant,
  doc: valueof string,
  check?: valueof SurfaceCheckInfo
);
