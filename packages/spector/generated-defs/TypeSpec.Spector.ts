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

export interface SurfaceCheck {
  readonly category: string;
  readonly doc: string;
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
 * Describe one or more expected properties of the **generated SDK surface** for
 * this element — things a wire test can't see, such as a client rename, an
 * access change, or a reshaped inheritance hierarchy. A single `@surfaceDoc`
 * may carry multiple checks (e.g. an element that is both made internal and
 * renamed). The description is stated once, language-agnostically; each emitter
 * validates it against its own generated code. Mirrors `@scenarioDoc`, but for
 * the surface instead of the wire.
 *
 * @param checks The surface assertions to validate for this element.
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
  checks: readonly SurfaceCheck[],
) => DecoratorValidatorCallbacks | void;

export type TypeSpecSpectorDecorators = {
  scenarioService: ScenarioServiceDecorator;
  scenario: ScenarioDecorator;
  scenarioDoc: ScenarioDocDecorator;
  surfaceDoc: SurfaceDocDecorator;
};
