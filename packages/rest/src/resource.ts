import type { DecoratorContext, Model, ModelProperty, Program, Type } from "@typespec/compiler";
import {
  $invisible,
  $removeVisibility,
  $visibility,
  getKeyName,
  getTypeName,
  isErrorType,
  isKey,
  setTypeSpecNamespace,
} from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import { $path } from "@typespec/http";
import type { ParentResourceDecorator } from "../generated-defs/TypeSpec.Rest.js";
import { createStateSymbol, reportDiagnostic } from "./lib.js";
import { CycleTracker } from "./utils/cycle-tracker/cycle-tracker.js";

/** Associates a resource model with the property used to identify its instances. */
export interface ResourceKey {
  /** Resource model associated with the key; inherited keys may refer to a base model. */
  resourceType: Model;
  /** Original key property, before it is copied into operation parameters. */
  keyProperty: ModelProperty;
}

const resourceKeysKey = createStateSymbol("resourceKeys");
const resourceTypeForKeyParamKey = createStateSymbol("resourceTypeForKeyParam");

/**
 * Records the key property for a resource, replacing any previously cached key.
 * This does not apply `@key` or modify the model's properties.
 */
export function setResourceTypeKey(
  program: Program,
  resourceType: Model,
  keyProperty: ModelProperty,
): void {
  program.stateMap(resourceKeysKey).set(resourceType, {
    resourceType,
    keyProperty,
  });
}

/**
 * Returns a cached resource key or discovers one from the model's own `@key` properties, then its base model.
 * When discovering keys, reports a diagnostic for additional keys on the same model and keeps the first key.
 * Discovered keys are cached for later queries.
 * Returns `undefined` when neither the model nor its base models have a key.
 */
export function getResourceTypeKey(program: Program, resourceType: Model): ResourceKey | undefined {
  // Look up the key first
  let resourceKey = program.stateMap(resourceKeysKey).get(resourceType);
  if (resourceKey) {
    return resourceKey;
  }

  // Try to find it in the resource type
  resourceType.properties.forEach((p: ModelProperty) => {
    if (isKey(program, p)) {
      if (resourceKey) {
        reportDiagnostic(program, {
          code: "duplicate-key",
          format: {
            resourceName: resourceType.name,
          },
          target: p,
        });
      } else {
        resourceKey = {
          resourceType,
          keyProperty: p,
        };

        // Cache the key for future queries
        setResourceTypeKey(program, resourceType, resourceKey.keyProperty);
      }
    }
  });

  // if still no key, search the base model
  if (resourceKey === undefined && resourceType.baseModel !== undefined) {
    resourceKey = getResourceTypeKey(program, resourceType.baseModel);

    if (resourceKey !== undefined) {
      // Cache the key for future queries
      setResourceTypeKey(program, resourceType, resourceKey.keyProperty);
    }
  }

  return resourceKey;
}

/**
 * Records the resource that a copied key parameter identifies.
 * Used when constructing resource key parameter models; it does not copy the key itself.
 */
export function $resourceTypeForKeyParam(
  context: DecoratorContext,
  entity: Type,
  resourceType: Type,
) {
  context.program.stateMap(resourceTypeForKeyParamKey).set(entity, resourceType);
}

setTypeSpecNamespace("Private", $resourceTypeForKeyParam);

/**
 * Returns the resource associated with a copied key parameter, or `undefined` if none was recorded.
 * This reads the parameter's metadata rather than inferring a resource from its type or name.
 */
export function getResourceTypeForKeyParam(
  program: Program,
  param: ModelProperty,
): Model | undefined {
  return program.stateMap(resourceTypeForKeyParamKey).get(param);
}

const VISIBILITY_DECORATORS = [$visibility, $invisible, $removeVisibility];

function cloneKeyProperties(context: DecoratorContext, target: Model, resourceType: Model) {
  const { program } = context;
  // Add parent keys first
  const parentType = getParentResource(program, resourceType);
  if (parentType) {
    cloneKeyProperties(context, target, parentType);
  }

  const resourceKey = getResourceTypeKey(program, resourceType);
  if (resourceKey) {
    const { keyProperty } = resourceKey;
    const keyName = getKeyName(program, keyProperty)!;

    const decorators = [
      // Filter out all visibility decorators because they affect metadata
      // filtering. NOTE: Check for name equality instead of function equality
      // to deal with multiple copies of core being used.
      ...keyProperty.decorators.filter((d) =>
        VISIBILITY_DECORATORS.every((visDec) => d.decorator.name !== visDec.name),
      ),
      {
        decorator: $resourceTypeForKeyParam,
        args: [{ node: target.node, value: resourceType, jsValue: resourceType }],
      },
    ];

    if (!keyProperty.decorators.some((d) => d.decorator.name === $path.name)) {
      decorators.push({
        decorator: $path,
        args: [],
      });
    }

    // Clone the key property and ensure that an optional key property doesn't
    // become an optional path parameter
    const newProp = program.checker.cloneType(keyProperty, {
      name: keyName,
      decorators,
      optional: false,
      model: target,
      sourceProperty: undefined,
    });

    // Add the key property to the target type
    target.properties.set(keyName, newProp);
  }
}

/**
 * Populates a `KeysOf<T>` or `ParentKeysOf<T>` model with required path parameters for resource keys.
 * Copies ancestor keys before the resource's own key, using each key's `@key` name and retaining
 * decorators other than visibility decorators.
 *
 * @param filter When `"parent"`, copies only ancestor keys; otherwise also copies the resource's key.
 */
export function $copyResourceKeyParameters(
  context: DecoratorContext,
  entity: Model,
  filter?: string,
) {
  const reportNoKeyError = () =>
    reportDiagnostic(context.program, {
      code: "not-key-type",
      target: entity,
    });
  const templateArguments = entity.templateMapper?.args;
  if (!templateArguments || templateArguments.length !== 1) {
    return reportNoKeyError();
  }

  if ((templateArguments[0] as any).kind !== "Model") {
    if (isErrorType(templateArguments[0])) {
      return;
    }
    return reportNoKeyError();
  }

  const resourceType = templateArguments[0] as Model;

  if (filter === "parent") {
    // Only copy keys of the parent type if there is one
    const parentType = getParentResource(context.program, resourceType);
    if (parentType) {
      cloneKeyProperties(context, entity, parentType);
    }
  } else {
    // Copy keys of the resource type and all parents
    cloneKeyProperties(context, entity, resourceType);
  }
}

export const [
  /**
   * Get the parent resource type for a given resource model.
   *
   * @param program The TypeSpec program instance
   * @param type The resource model to get the parent for
   * @returns The parent resource model if one exists, otherwise `undefined`
   *
   * @example
   *
   * ```tsp
   * @parentResource(Organization)
   * model User {}
   * ```
   *
   * ```typescript
   * const parentType = getParentResource(program, userModel);
   * // parentType would be the Organization model
   * ```
   */
  getParentResource,

  /**
   * Set parent resource for a resource.
   * Same as applying `@parentResource` decorator.
   */
  setParentResource,
] = useStateMap<Model, Model>(createStateSymbol("parentResourceTypes"));

/**
 * `@parentResource` marks a model with a reference to its parent resource type
 *
 * The first argument should be a reference to a model type which will be treated as the parent
 * type of the target model type.  This will cause the `@key` properties of all parent types of
 * the target type to show up in operations of the `Resource*<T>` interfaces defined in this library.
 *
 * `@parentResource` can only be applied to models.
 */
export const $parentResource: ParentResourceDecorator = (
  context: DecoratorContext,
  entity: Model,
  parentType: Model,
) => {
  const { program } = context;
  if (!checkCircularParentResource(program, entity, parentType)) {
    return;
  }
  setParentResource(program, entity, parentType);
};

function checkCircularParentResource(program: Program, entity: Model, parentType: Model): boolean {
  const cycleTracker = new CycleTracker<Model>();
  cycleTracker.add(entity);
  let currentType: Model | undefined = parentType;
  while (currentType) {
    const cycle = cycleTracker.add(currentType);
    if (cycle) {
      for (const type of cycle) {
        cycleTracker.add(type);
        reportDiagnostic(program, {
          code: "circular-parent-resource",
          format: { cycle: [...cycle, cycle[0]].map((x) => getTypeName(x)).join(" -> ") },
          target: type,
        });
      }
      return false;
    }
    currentType = getParentResource(program, currentType);
  }
  return true;
}
