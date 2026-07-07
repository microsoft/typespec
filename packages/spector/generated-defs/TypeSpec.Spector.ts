import type {
  DecoratorContext,
  DecoratorValidatorCallbacks,
  Enum,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";

export interface SurfaceCheckInfo {
  readonly category: string;
  readonly expected?: string;
  readonly kind?: string;
  readonly expectedBase?: string;
  readonly expectedClient?: string;
  readonly absentFrom?: string;
  readonly internal?: boolean;
}

/**
 * Setup the boilerplate for a scenario service(server endpoint, etc.)
 */
export type ScenarioServiceDecorator = (
  context: DecoratorContext,
  target: Namespace,
  route: string,
  options?: Type,
) => DecoratorValidatorCallbacks | void;

/**
 * Mark an operation, interface or namespace as a scenario. All containing operations will be part of the same scenario.
 */
export type ScenarioDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface | Operation,
  name?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Specify documentation on how to implement this scenario.
 *
 * @param doc Documentation
 * @param formatArgs Format arguments
 */
export type ScenarioDocDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface | Operation,
  doc: string,
  formatArgs?: Model,
) => DecoratorValidatorCallbacks | void;

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
export type SurfaceDocDecorator = (
  context: DecoratorContext,
  target:
    | Namespace
    | Interface
    | Operation
    | Model
    | Enum
    | Union
    | ModelProperty
    | EnumMember
    | UnionVariant,
  doc: string,
  check?: SurfaceCheckInfo,
) => DecoratorValidatorCallbacks | void;

export type TypeSpecSpectorDecorators = {
  scenarioService: ScenarioServiceDecorator;
  scenario: ScenarioDecorator;
  scenarioDoc: ScenarioDocDecorator;
  surfaceDoc: SurfaceDocDecorator;
};
