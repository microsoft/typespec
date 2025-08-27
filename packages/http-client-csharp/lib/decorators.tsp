import "../dist/emitter/src/lib/decorators.js";

using TypeSpec.Reflection;

namespace TypeSpec.HttpClient;

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
 *
 * // Using augment decorator pattern where target needs to be passed
 * @@dynamicModel(Pet);
 * ```
 */
extern dec dynamicModel(target: Model | Namespace);
