import type {
  DecoratorContext,
  DecoratorValidatorCallbacks,
  Interface,
  Model,
  Namespace,
  Operation,
  Type,
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
 * @param category The kind of surface assertion. See {
 * @link SurfaceCategory}.
 * @param subject The type or member the check is about (may differ from `target`).
 * @param expected The expected client-surface output for this category.
 * @param doc Optional extra natural-language description. Markdown.
 */
export type SurfaceDocDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface | Operation,
  category:
    | string
    | "naming"
    | "access"
    | "client-location"
    | "hierarchy"
    | "flatten"
    | "paging"
    | "other",
  subject: Type,
  expected: string,
  doc?: string,
) => DecoratorValidatorCallbacks | void;

export type TypeSpecSpectorDecorators = {
  scenarioService: ScenarioServiceDecorator;
  scenario: ScenarioDecorator;
  scenarioDoc: ScenarioDocDecorator;
  surfaceDoc: SurfaceDocDecorator;
};
