namespace TypeSpec.CSharp;

/**
 * Marks a model to use AdditionalProperties-based serialization in C#
 * instead of the traditional _serializedAdditionalRawData approach.
 * 
 * When this decorator is applied to a model:
 * - The model will have a Patch property of type AdditionalProperties
 * - Deserialization will use AdditionalProperties.Set(...) methods
 * - Serialization will check for patches and propagate to child objects
 * 
 * @example
 * ```tsp
 * @dynamicModel
 * model MyModel {
 *   name: string;
 *   value: int32;
 * }
 * ```
 */
extern dec dynamicModel(target: Model);