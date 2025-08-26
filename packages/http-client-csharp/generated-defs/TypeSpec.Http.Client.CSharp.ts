import type { DecoratorContext, Model, Namespace } from "@typespec/compiler";

/**
 * Marks a model or namespace as dynamic, indicating it should generate dynamic model code.
 * Can be applied to Model or Namespace types.
 * 
 * @example
 * ```tsp
 * @dynamicModel
 * model Pet {
 *   name: string;
 *   kind: string;
 * }
 * 
 * @dynamicModel
 * namespace PetStore {
 *   model Dog extends Pet {
 *     breed: string;
 *   }
 * }
 * ```
 */
export type DynamicModelDecorator = (
  context: DecoratorContext,
  target: Model | Namespace,
) => void;

export type TypeSpecHttpClientCSharpDecorators = {
  dynamicModel: DynamicModelDecorator;
};