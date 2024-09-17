import type {
  DecoratorContext,
  EnumValue,
  Interface,
  Namespace,
  Operation,
  Type,
} from "@typespec/compiler";

export interface Record {}

/**
 * Setup the boilerplate for a scenario service(server endpoint, etc.)
 */
export type ScenarioServiceDecorator = (
  context: DecoratorContext,
  target: Namespace,
  route: Type,
  options?: { readonly versioned?: EnumValue },
) => void;

/**
 * Mark an operation, interface or namespace as a scenario. All containing operations will be part of the same scenario.
 */
export type ScenarioDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface | Operation,
  name?: Type,
) => void;

/**
 * Specify documentation on how to implement this scenario.
 *
 * @param doc Documentation
 * @param formatArgs Format arguments
 */
export type ScenarioDocDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface | Operation,
  doc: Type,
  formatArgs?: Record,
) => void;

export type TypeSpecSpecLibDecorators = {
  scenarioService: ScenarioServiceDecorator;
  scenario: ScenarioDecorator;
  scenarioDoc: ScenarioDocDecorator;
};
