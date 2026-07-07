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
 * Describe, in plain natural language, one or more expected properties of the
 * **generated SDK surface** for this element — things a wire test can't see,
 * such as a client rename, an access change, an operation relocated to another
 * client, or a reshaped inheritance hierarchy. Mirrors `@scenarioDoc`, but for
 * the surface instead of the wire.
 *
 * The prose states intent once, language-agnostically. The precompute step
 * (`listSurfaceDocs`) additionally inspects the element's own client decorators
 * (e.g. `@clientName`, `@access`, `@clientLocation`, `@hierarchyBuilding`) to
 * derive the machine-checkable, routable fields of each check — so an author
 * typically just writes the sentence and applies the normal client decorator.
 * A property with no recognized client decorator becomes an AI-verified check
 * against the prose.
 *
 * @param doc Natural-language description of the expected surface. Markdown.
 * @param formatArgs Format arguments interpolated into `doc` (as in `@scenarioDoc`).
 */
extern dec surfaceDoc(
  target: Namespace | Interface | Operation | Model | Enum | Union | ModelProperty | EnumMember | UnionVariant,
  doc: valueof string,
  formatArgs?: Model
);
