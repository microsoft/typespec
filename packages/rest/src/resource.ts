import {
  $visibility,
  DecoratorContext,
  getKeyName,
  isErrorType,
  isKey,
  Model,
  ModelProperty,
  Program,
  Type,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./diagnostics.js";
import { $path } from "./http/decorators.js";

export interface ResourceKey {
  resourceType: Model;
  keyProperty: ModelProperty;
}

const resourceKeysKey = Symbol("resourceKeys");
const resourceTypeForKeyParamKey = Symbol("resourceTypeForKeyParam");

export function setResourceTypeKey(
  program: Program,
  resourceType: Model,
  keyProperty: ModelProperty
): void {
  program.stateMap(resourceKeysKey).set(resourceType, {
    resourceType,
    keyProperty,
  });
}

export function getResourceTypeKey(program: Program, resourceType: Model): ResourceKey {
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

  return resourceKey;
}

export function $resourceTypeForKeyParam(
  context: DecoratorContext,
  entity: Type,
  resourceType: Type
) {
  if (!validateDecoratorTarget(context, entity, "@resourceTypeForKeyParam", "ModelProperty")) {
    return;
  }

  context.program.stateMap(resourceTypeForKeyParamKey).set(entity, resourceType);
}

export function getResourceTypeForKeyParam(
  program: Program,
  param: ModelProperty
): Model | undefined {
  return program.stateMap(resourceTypeForKeyParamKey).get(param);
}

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
    const keyName = getKeyName(program, keyProperty);

    // Filter out the @visibility decorator because it might affect metadata
    // filtering
    const decorators = [
      ...keyProperty.decorators.filter((d) => d.decorator !== $visibility),
      {
        decorator: $path,
        args: [],
      },
      {
        decorator: $resourceTypeForKeyParam,
        args: [{ node: target.node, value: resourceType }],
      },
    ];

    // Clone the key property and ensure that an optional key property doesn't
    // become an optional path parameter
    const newProp = program.checker.cloneType(keyProperty, {
      name: keyName,
      decorators,
      optional: false,
    });

    // Add the key property to the target type
    target.properties.set(keyName, newProp);
  }
}

export function $copyResourceKeyParameters(
  context: DecoratorContext,
  entity: Type,
  filter?: string
) {
  if (!validateDecoratorTarget(context, entity, "@copyResourceKeyParameters", "Model")) {
    return;
  }

  const reportNoKeyError = () =>
    reportDiagnostic(context.program, {
      code: "not-key-type",
      target: entity,
    });
  const templateArguments = entity.templateArguments;
  if (!templateArguments || templateArguments.length !== 1) {
    return reportNoKeyError();
  }

  if (templateArguments[0].kind !== "Model") {
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

const parentResourceTypesKey = Symbol("parentResourceTypes");
export function getParentResource(program: Program, resourceType: Model): Model | undefined {
  return program.stateMap(parentResourceTypesKey).get(resourceType);
}

/**
 * `@parentResource` marks a model with a reference to its parent resource type
 *
 * The first argument should be a reference to a model type which will be treated as the parent
 * type of the target model type.  This will cause the `@key` properties of all parent types of
 * the target type to show up in operations of the `Resource*<T>` interfaces defined in this library.
 *
 * `@parentResource` can only be applied to models.
 */
export function $parentResource(context: DecoratorContext, entity: Type, parentType: Type) {
  if (!validateDecoratorTarget(context, parentType, "@parentResource", "Model")) {
    return;
  }
  const { program } = context;

  program.stateMap(parentResourceTypesKey).set(entity, parentType);

  // Ensure that the parent resource type(s) don't have key name conflicts
  const keyNameSet = new Set<string>();
  let currentType: Model | undefined = entity as Model;
  while (currentType) {
    const resourceKey = getResourceTypeKey(program, currentType);
    const keyName = getKeyName(program, resourceKey.keyProperty);
    if (keyNameSet.has(keyName)) {
      reportDiagnostic(program, {
        code: "duplicate-parent-key",
        format: {
          resourceName: (entity as Model).name,
          parentName: currentType.name,
          keyName,
        },
        target: resourceKey.keyProperty,
      });
      return;
    }

    keyNameSet.add(keyName);
    currentType = getParentResource(program, currentType);
  }
}
