// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import "../../dist/src/lib/tsp-index.js";

using TypeSpec.Reflection;

namespace TypeSpec;

/**
 * Indicates that a property is only considered to be present or applicable ("visible") with
 * the in the given named contexts ("visibilities"). When a property has no visibilities applied
 * to it, it is implicitly visible always.
 *
 * As far as the TypeSpec core library is concerned, visibilities are open-ended and can be arbitrary
 * strings, but  the following visibilities are well-known to standard libraries and should be used
 * with standard emitters that interpret them as follows:
 *
 * - "read": output of any operation.
 * - "create": input to operations that create an entity..
 * - "query": input to operations that read data.
 * - "update": input to operations that update data.
 * - "delete": input to operations that delete data.
 *
 * See also: [Automatic visibility](https://typespec.io/docs/libraries/http/operations#automatic-visibility)
 *
 * @param visibilities List of visibilities which apply to this property.
 *
 * @example
 *
 * ```typespec
 * model Dog {
 *   // the service will generate an ID, so you don't need to send it.
 *   @visibility("read") id: int32;
 *   // the service will store this secret name, but won't ever return it
 *   @visibility("create", "update") secretName: string;
 *   // the regular name is always present
 *   name: string;
 * }
 * ```
 */
extern dec visibility(target: ModelProperty, ...visibilities: valueof (string | EnumMember)[]);

extern dec invisible(target: ModelProperty, visibilityClass: Enum);

/**
 * Removes properties that are not considered to be present or applicable
 * ("visible") in the given named contexts ("visibilities"). Can be used
 * together with spread to effectively spread only visible properties into
 * a new model.
 *
 * See also: [Automatic visibility](https://typespec.io/docs/libraries/http/operations#automatic-visibility)
 *
 * When using an emitter that applies visibility automatically, it is generally
 * not necessary to use this decorator.
 *
 * @param visibilities List of visibilities which apply to this property.
 *
 * @example
 * ```typespec
 * model Dog {
 *   @visibility("read") id: int32;
 *   @visibility("create", "update") secretName: string;
 *   name: string;
 * }
 *
 * // The spread operator will copy all the properties of Dog into DogRead,
 * // and @withVisibility will then remove those that are not visible with
 * // create or update visibility.
 * //
 * // In this case, the id property is removed, and the name and secretName
 * // properties are kept.
 * @withVisibility("create", "update")
 * model DogCreateOrUpdate {
 *   ...Dog;
 * }
 *
 * // In this case the id and name properties are kept and the secretName property
 * // is removed.
 * @withVisibility("read")
 * model DogRead {
 *   ...Dog;
 * }
 * ```
 */
extern dec withVisibility(target: Model, ...visibilities: valueof (string | EnumMember)[]);

/**
 * Set the visibility of key properties in a model if not already set.
 *
 * @param visibility The desired default visibility value. If a key property already has a `visibility` decorator then the default visibility is not applied.
 */
extern dec withDefaultKeyVisibility(target: Model, visibility: valueof string | EnumMember);

/**
 * Sets which visibilities apply to parameters for the given operation.
 * @param visibilities List of visibility strings which apply to this operation.
 */
extern dec parameterVisibility(target: Operation, ...visibilities: valueof (string | EnumMember)[]);

/**
 * Sets which visibilities apply to the return type for the given operation.
 * @param visibilities List of visibility strings which apply to this operation.
 */
extern dec returnTypeVisibility(
  target: Operation,
  ...visibilities: valueof (string | EnumMember)[]
);

/**
 * Returns the model with non-updateable properties removed.
 */
extern dec withUpdateableProperties(target: Model);

/**
 * A visibility class for resource lifecycle phases.
 *
 * These visibilities control whether a property is visible during the create, read, and update phases of a resource's
 * lifecycle.
 *
 * @example
 * ```typespec
 * model Dog {
 *  @visibility(Lifecycle.Read) id: int32;
 *  @visibility(Lifecycle.Create, Lifecycle.Update) secretName: string;
 *  name: string;
 * }
 * ```
 *
 * In this example, the `id` property is only visible during the read phase, and the `secretName` property is only visible
 * during the create and update phases. This means that the server will return the `id` property when returning a `Dog`,
 * but the client will not be able to set or update it. In contrast, the `secretName` property can be set when creating
 * or updating a `Dog`, but the server will never return it. The `name` property has no visibility modifiers and is
 * therefore visible in all phases.
 */
enum Lifecycle {
  Create,
  Read,
  Update,
}
