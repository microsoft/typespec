import { Type } from "@typespec/compiler";

/**
 * A type that extends `Type` and includes a `name` property that can either be a `string` or `symbol`.
 * This type is used to represent objects that have a `name` of type `string` or `symbol`.
 *
 * @template T - The type that extends `Type` and includes a `name` property of type `string | symbol`.
 */
export type HasName<T extends Type> = T & { name: string | symbol };

/**
 * Interface defining the transformation policy for names.
 * It contains methods for obtaining transport and application names based on the input `Type` objects.
 */
export interface TransformNamePolicy {
  /**
   * Transforms the name of the given `type` into a transport name.
   * The `type` must have a `name` property that is a `string | symbol`.
   *
   * @param type - The object that has a `name` property of type `string | symbol`.
   * @returns A string representing the transformed transport name.
   */
  getTransportName<T extends HasName<Type>>(type: T): string;

  /**
   * Transforms the name of the given `type` into an application name.
   * The `type` must have a `name` property that is a `string | symbol`.
   *
   * @param type - The object that has a `name` property of type `string | symbol`.
   * @returns A string representing the transformed application name.
   */
  getApplicationName<T extends HasName<Type>>(type: T): string;
}

/**
 * Factory function to create a `TransformNamePolicy` instance, which contains the logic for transforming
 * transport and application names. The `namer` functions are used to generate the transport and application names.
 *
 * @param namer - An object with two functions: `transportNamer` and `applicationNamer`, each accepting a `Type` and returning a string.
 * @returns A `TransformNamePolicy` object with the implemented methods for transforming names.
 */
export function createTransformNamePolicy(namer: {
  transportNamer: <T extends HasName<Type>>(type: T) => string;
  applicationNamer: <T extends HasName<Type>>(type: T) => string;
}): TransformNamePolicy {
  return {
    /**
     * Transforms the transport name based on the provided `transportNamer` function.
     *
     * @param type - The object that has a `name` property of type `string | symbol`.
     * @returns The transformed transport name as a string.
     */
    getTransportName(type) {
      return namer.transportNamer(type);
    },

    /**
     * Transforms the application name based on the provided `applicationNamer` function.
     *
     * @param type - The object that has a `name` property of type `string | symbol`.
     * @returns The transformed application name as a string.
     */
    getApplicationName(type) {
      return namer.applicationNamer(type);
    },
  };
}
