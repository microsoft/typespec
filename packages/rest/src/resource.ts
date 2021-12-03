import {
  InterfaceType,
  ModelType,
  ModelTypeProperty,
  OperationType,
  Program,
  setDecoratorNamespace,
  Type,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./diagnostics.js";
import { $path, getOperationRoute, getPathParamName, hasBody, HttpVerb } from "./http.js";
import { getAction, getResourceOperation, getSegment } from "./rest.js";

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

function getSegmentForResourceType(program: Program, resourceType: ModelType): string {
  // Get key property for type
  const key = getResourceTypeKey(program, resourceType);

  // Get segment name for key property
  return getSegment(program, key.keyProperty) || lowerCaseFirstChar(resourceType.name);
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

export interface OperationDetails {
  path: string;
  verb: HttpVerb;
  parameters: ModelTypeProperty[];
  operation: OperationType;
}

function lowerCaseFirstChar(str: string): string {
  return str[0].toLocaleLowerCase() + str.substring(1);
}

export function getInterfaceOperations(program: Program, iface: InterfaceType): OperationDetails[] {
  const operations: OperationDetails[] = [];

  for (const [_, op] of iface.operations) {
    // TODO: Allow parent route to be passed in as parameter, start with that
    let fullPath = "";
    const filteredParameters: ModelTypeProperty[] = [];
    const route = getOperationRoute(program, op);

    // TODO: Allow explicit @route to override the generated path
    for (const [name, param] of op.parameters.properties) {
      if (getPathParamName(program, param)) {
        const segment = getSegment(program, param);

        // Don't add the segment prefix if it is meant to be excluded
        // (empty string means exclude the segment)
        if (segment !== "") {
          fullPath += `/${segment}`;
        }

        // Add the path variable for the parameter
        if (param.type.kind === "String") {
          fullPath += `/${param.type.value}`;
          continue; // Skip adding to the parameter list
        } else {
          fullPath += `/{${param.name}}`;
        }
      }

      filteredParameters.push(param);
    }

    // It's an action if not marked as another resource operation
    const resourceOperation = getResourceOperation(program, op);
    if (!resourceOperation) {
      // Append the action name if necessary
      const action = getAction(program, op, op.name);
      fullPath += `/${lowerCaseFirstChar(action!)}`;
    } else {
      if (resourceOperation.operation === "list") {
        // Extract the key for the resource type, grab the segment
        const segment = getSegmentForResourceType(program, resourceOperation.resourceType);
        fullPath += `/${segment}`;
      }
    }

    let verb =
      (resourceOperation && resourceOperationToVerb[resourceOperation.operation]) ||
      route?.verb ||
      (hasBody(program, filteredParameters) ? "post" : "get");

    // TODO: Allow overriding the existing resource operation of the same kind
    operations.push({
      path: fullPath,
      verb,
      parameters: filteredParameters,
      operation: op,
    });
  }

  return operations;
}

const resourceOperationToVerb: any = {
  read: "get",
  create: "post",
  createOrUpdate: "put",
  update: "patch",
  delete: "delete",
  list: "get",
};

setDecoratorNamespace("Cadl.Rest.Resource", $parentResource, $copyResourceKeyParameters, $key);
