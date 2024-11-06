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
 *   @visibility(Lifecycle.Read) id: int32;
 *   // the service will store this secret name, but won't ever return it
 *   @visibility(Lifecycle.Create, Lifecycle.Update) secretName: string;
 *   // the regular name is always present
 *   name: string;
 * }
 * ```
 */
extern dec visibility(target: ModelProperty, ...visibilities: valueof (string | EnumMember)[]);

/**
 * Indicates that a property is not visible in the given visibility class.
 *
 * This decorator removes all active visibility modifiers from the property within
 * the given visibility class.
 *
 * @param visibilityClass The visibility class to make the property invisible within.
 *
 * @example
 * ```typespec
 * model Example {
 *   @invisible(Lifecycle)
 *   hidden_property: string;
 * }
 * ```
 */
extern dec invisible(target: ModelProperty, visibilityClass: Enum);

/**
 * Removes visibility modifiers from a property.
 *
 * If the visibility modifiers for a visibility class have not been initialized,
 * this decorator will use the default visibility modifiers for the visibility
 * class as the default modifier set.
 *
 * @param target The property to remove visibility from.
 * @param visibilities The visibility modifiers to remove from the target property.
 *
 * @example
 * ```typespec
 * model Example {
 *   // This property will have the Create and Update visibilities, but not the
 *   // Read visibility, since it is removed.
 *   @removeVisibility(Lifecycle.Read)
 *   secret_property: string;
 * }
 * ```
 */
extern dec removeVisibility(target: ModelProperty, ...visibilities: valueof EnumMember[]);

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
 * This will set the visibility modifiers of all key properties in the model if the visibility is not already _explicitly_ set,
 * but will not change the visibility of any properties that have visibility set _explicitly_, even if the visibility
 * is the same as the default visibility.
 *
 * Visibility may be explicitly set using any of the following decorators:
 *
 * - `@visibility`
 * - `@removeVisibility`
 * - `@invisible`
 *
 * @param visibility The desired default visibility value. If a key property already has visibility set, it will not be changed.
 */
extern dec withDefaultKeyVisibility(target: Model, visibility: valueof string | EnumMember);

/**
 * Sets which visibilities apply to parameters for the given operation.
 *
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
 * Declares the default visibility modifiers for a visibility class.
 *
 * The default modifiers are used when a property does not have any visibility decorators
 * applied to it.
 *
 * The modifiers passed to this decorator _MUST_ be members of the target Enum.
 *
 * @param visibilities the list of modifiers to use as the default visibility modifiers.
 */
extern dec defaultVisibility(target: Enum, ...visibilities: valueof EnumMember[]);

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

/**
 * A visibility filter, used to specify which properties should be included when
 * using the `withVisibilityFilter` decorator.
 *
 * The filter matches any property with ALL of the following:
 * - If the `any` key is present, the property must have at least one of the specified visibilities.
 * - If the `all` key is present, the property must have all of the specified visibilities.
 * - If the `none` key is present, the property must have none of the specified visibilities.
 */
model VisibilityFilter {
  any?: EnumMember[];
  all?: EnumMember[];
  none?: EnumMember[];
}

/**
 * Applies the given visibility filter to the properties of the target model.
 *
 * This transformation is recursive, so it will also apply the filter to any nested
 * or referenced models that are the types of any properties in the `target`.
 *
 * @param target The model to apply the visibility filter to.
 * @param filter The visibility filter to apply to the properties of the target model.
 *
 * @example
 * ```typespec
 * model Dog {
 *   @visibility(Lifecycle.Read)
 *   id: int32;
 *
 *   name: string;
 * }
 *
 * @withVisibilityFilter(#{ all: #[Lifecycle.Read] })
 * model DogRead {
 *  ...Dog
 * }
 * ```
 */
extern dec withVisibilityFilter(target: Model, filter: valueof VisibilityFilter);

/**
 * Transforms the `target` model to include only properties that are visible during the
 * "Update" lifecycle phase.
 *
 * Any nested models of optional properties will be transformed into the "CreateOrUpdate"
 * lifecycle phase instead of the "Update" lifecycle phase, so that nested models may be
 * fully updated.
 *
 * @param target The model to apply the transformation to.
 *
 * @example
 * ```typespec
 * model Dog {
 *   @visibility(Lifecycle.Read)
 *   id: int32;
 *
 *   @visibility(Lifecycle.Create, Lifecycle.Update)
 *   secretName: string;
 *
 *   name: string;
 * }
 *
 * @withLifecycleUpdate
 * model DogUpdate {
 *   ...Dog
 * }
 * ```
 */
extern dec withLifecycleUpdate(target: Model);

/**
 * A copy of the input model `T` with only the properties that are visible during the
 * "Create" resource lifecycle phase.
 *
 * This transformation is recursive, and will include only properties that have the
 * `Lifecycle.Create` visibility modifier.
 *
 * If a `NameTemplate` is provided, the new model will be named according to the template.
 * The template uses the same syntax as the `@friendlyName` decorator.
 *
 * @template T The model to transform.
 * @template NameTemplate The name template to use for the new model.
 *
 *  * @example
 * ```typespec
 * model Dog {
 *   @visibility(Lifecycle.Read)
 *   id: int32;
 *
 *   name: string;
 * }
 *
 * model CreateDog is Create<Dog>;
 * ```
 */
@friendlyName(NameTemplate, T)
@withVisibilityFilter(#{ all: #[Lifecycle.Create] })
model Create<T extends Reflection.Model, NameTemplate extends valueof string = "Create{name}"> {
  ...T;
}

/**
 * A copy of the input model `T` with only the properties that are visible during the
 * "Read" resource lifecycle phase.
 *
 * This transformation is recursive, and will include only properties that have the
 * `Lifecycle.Read` visibility modifier.
 *
 * If a `NameTemplate` is provided, the new model will be named according to the template.
 * The template uses the same syntax as the `@friendlyName` decorator.
 *
 * @template T The model to transform.
 * @template NameTemplate The name template to use for the new model.
 *
 *  * @example
 * ```typespec
 * model Dog {
 *   @visibility(Lifecycle.Read)
 *   id: int32;
 *
 *   name: string;
 * }
 *
 * model ReadDog is Read<Dog>;
 * ```
 */
@friendlyName(NameTemplate, T)
@withVisibilityFilter(#{ all: #[Lifecycle.Read] })
model Read<T extends Reflection.Model, NameTemplate extends valueof string = "Read{name}"> {
  ...T;
}

/**
 * A copy of the input model `T` with only the properties that are visible during the
 * "Update" resource lifecycle phase.
 *
 * This transformation will include only the properties that have the `Lifecycle.Update`
 * visibility modifier, and the types of all properties will be replaced with the
 * equivalent `CreateOrUpdate` transformation.
 *
 * If a `NameTemplate` is provided, the new model will be named according to the template.
 * The template uses the same syntax as the `@friendlyName` decorator.
 *
 * @template T The model to transform.
 * @template NameTemplate The name template to use for the new model.
 *
 *  * @example
 * ```typespec
 * model Dog {
 *   @visibility(Lifecycle.Read)
 *   id: int32;
 *
 *   name: string;
 * }
 *
 * model UpdateDog is Update<Dog>;
 * ```
 */
@friendlyName(NameTemplate, T)
@withLifecycleUpdate
model Update<T extends Reflection.Model, NameTemplate extends valueof string = "Update{name}"> {
  ...T;
}

/**
 * A copy of the input model `T` with only the properties that are visible during the
 * "Create" or "Update" resource lifecycle phases.
 *
 * This transformation is recursive, and will include only properties that have the
 * `Lifecycle.Create` or `Lifecycle.Update` visibility modifier.
 *
 * If a `NameTemplate` is provided, the new model will be named according to the template.
 * The template uses the same syntax as the `@friendlyName` decorator.
 *
 * @template T The model to transform.
 * @template NameTemplate The name template to use for the new model.
 *
 *  * @example
 * ```typespec
 * model Dog {
 *   @visibility(Lifecycle.Read)
 *   id: int32;
 *
 *   name: string;
 * }
 *
 * model CreateOrUpdateDog is CreateOrUpdate<Dog>;
 * ```
 */
@friendlyName(NameTemplate, T)
@withVisibilityFilter(#{ any: #[Lifecycle.Create, Lifecycle.Update] })
model CreateOrUpdate<
  T extends Reflection.Model,
  NameTemplate extends valueof string = "CreateOrUpdate{name}"
> {
  ...T;
}
