import {
  ModelType,
  ModelTypeProperty,
  Program,
  setDecoratorNamespace,
  Type,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./diagnostics.js";
import { $path } from "./http.js";

export interface ResourceKey {
  resourceType: ModelType;
  keyProperty: ModelTypeProperty;
}

const resourceKeyPropertiesKey = Symbol();

export function $key(program: Program, entity: Type, altName?: string): void {
  if (entity.kind !== "ModelProperty") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "key", entityKind: entity.kind },
      target: entity,
    });
    return;
  }

  // Register the key property
  program.stateMap(resourceKeyPropertiesKey).set(entity, altName || entity.name);
}

export function isKey(program: Program, property: ModelTypeProperty) {
  return program.stateMap(resourceKeyPropertiesKey).has(property);
}

export function getKeyName(program: Program, property: ModelTypeProperty): string {
  return program.stateMap(resourceKeyPropertiesKey).get(property);
}

const resourceKeysKey = Symbol();

export function setResourceTypeKey(
  program: Program,
  resourceType: ModelType,
  keyProperty: ModelTypeProperty
): void {
  program.stateMap(resourceKeysKey).set(resourceType, {
    resourceType,
    keyProperty,
  });
}

export function getResourceTypeKey(program: Program, resourceType: ModelType): ResourceKey {
  // Look up the key first
  let resourceKey = program.stateMap(resourceKeysKey).get(resourceType);
  if (resourceKey) {
    return resourceKey;
  }

  // Try to find it in the resource type
  resourceType.properties.forEach((p: ModelTypeProperty) => {
    if (isKey(program, p)) {
      if (resourceKey) {
        throw new Error(`More than one key found on model type ${resourceType.name}`);
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

function cloneKeyProperties(program: Program, target: ModelType, resourceType: ModelType) {
  // Add parent keys first
  const parentType = getParentResource(program, resourceType);
  if (parentType) {
    cloneKeyProperties(program, target, parentType);
  }

  const resourceKey = getResourceTypeKey(program, resourceType);
  if (resourceKey) {
    const { keyProperty } = resourceKey;
    const keyName = getKeyName(program, keyProperty);

    const newProp = program.checker!.cloneType(keyProperty);
    newProp.name = keyName;
    newProp.decorators.push({
      decorator: $path,
      args: [],
    });
    $path(program, newProp, undefined as any);

    target.properties.set(keyName, newProp);
  }
}

export function $copyResourceKeyParameters(program: Program, entity: Type, filter?: string) {
  if (entity.kind !== "Model") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "copyResourceKeyParameters", entityKind: entity.kind },
      target: entity,
    });
    return;
  }

  if (
    !entity.templateArguments ||
    entity.templateArguments.length !== 1 ||
    entity.templateArguments[0].kind !== "Model"
  ) {
    reportDiagnostic(program, {
      code: "not-key-type",
      target: entity,
    });
    return;
  }

  const resourceType = entity.templateArguments![0] as ModelType;

  if (filter === "parent") {
    // Only copy keys of the parent type if there is one
    const parentType = getParentResource(program, resourceType);
    if (parentType) {
      cloneKeyProperties(program, entity, parentType);
    }
  } else {
    // Copy keys of the resource type and all parents
    cloneKeyProperties(program, entity, resourceType);
  }
}

const parentResourceTypesKey = Symbol();
export function getParentResource(
  program: Program,
  resourceType: ModelType
): ModelType | undefined {
  return program.stateMap(parentResourceTypesKey).get(resourceType);
}

export function $parentResource(program: Program, entity: Type, parentType: Type) {
  if (parentType.kind !== "Model") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "parentResource", entityKind: entity.kind },
      target: entity,
    });
    return;
  }

  program.stateMap(parentResourceTypesKey).set(entity, parentType);
}

setDecoratorNamespace("Cadl.Rest.Resource", $parentResource, $copyResourceKeyParameters, $key);
