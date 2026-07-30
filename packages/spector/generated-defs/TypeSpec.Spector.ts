import {
  type DecoratorContext,
  type DecoratorValidatorCallbacks,
  getAutoDecoratorValue,
  type Interface,
  type Model,
  type Namespace,
  type Operation,
  type Program,
  setAutoDecorator,
  type Type,
} from "@typespec/compiler";

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

export type TypeSpecSpectorDecorators = {
  scenarioService: ScenarioServiceDecorator;
  scenario: ScenarioDecorator;
  scenarioDoc: ScenarioDocDecorator;
};

export function getSurfaceDoc(
  program: Program,
  target: Namespace | Interface | Operation,
):
  | {
      readonly category:
        | string
        | "naming"
        | "access"
        | "client-location"
        | "hierarchy"
        | "flatten"
        | "paging"
        | "other";
      readonly expected: string | Record<string, string>;
      readonly subject?: string;
      readonly kind?: string;
      readonly doc?: string;
    }
  | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.Spector.surfaceDoc", target)?.["check"] as any;
}

export function setSurfaceDoc(
  program: Program,
  target: Namespace | Interface | Operation,
  check: {
    readonly category:
      | string
      | "naming"
      | "access"
      | "client-location"
      | "hierarchy"
      | "flatten"
      | "paging"
      | "other";
    readonly expected: string | Record<string, string>;
    readonly subject?: string;
    readonly kind?: string;
    readonly doc?: string;
  },
): void {
  setAutoDecorator(program, "TypeSpec.Spector.surfaceDoc", target, { check: check });
}
