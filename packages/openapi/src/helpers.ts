import {
  getFriendlyName,
  getServiceNamespace,
  isTemplateInstance,
  ModelProperty,
  Operation,
  Program,
  Type,
  TypeNameOptions,
} from "@cadl-lang/compiler";
import { getOperationId } from "./decorators.js";
import { reportDiagnostic } from "./lib.js";

/**
 * Determines whether a type will be inlined in OpenAPI rather than defined
 * as a schema and referenced.
 *
 * All anonymous types (anonymous models, arrays, tuples, etc.) are inlined.
 *
 * Template instantiations are inlined unless they have a friendly name.
 *
 * A friendly name can be provided by the user using `@friendlyName`
 * decorator, or chosen by default in simple cases.
 */
export function shouldInline(program: Program, type: Type): boolean {
  if (getFriendlyName(program, type)) {
    return false;
  }
  switch (type.kind) {
    case "Model":
      return (
        !type.name ||
        isTemplateInstance(type) ||
        program.checker.isStdType(type, "Array") ||
        program.checker.isStdType(type, "Record")
      );
    case "Enum":
    case "Union":
      return !type.name;
    default:
      return true;
  }
}

/**
 * Gets the name of a type to be used in OpenAPI.
 *
 * For inlined types: this is the Cadl-native name written to `x-cadl-name`.
 *
 * For non-inlined types: this is either the friendly name or the Cadl-native name.
 *
 * Cadl-native names are shortened to exclude root `Cadl` namespace and service
 * namespace using the provided `TypeNameOptions`.
 */
export function getTypeName(
  program: Program,
  type: Type,
  options: TypeNameOptions,
  existing?: Record<string, any>
): string {
  const name = getFriendlyName(program, type) ?? program.checker.getTypeName(type, options);

  if (existing && existing[name]) {
    reportDiagnostic(program, {
      code: "duplicate-type-name",
      format: {
        value: name,
      },
      target: type,
    });
  }

  return name;
}

/**
 * Gets the key that is used to define a parameter in OpenAPI.
 */
export function getParameterKey(
  program: Program,
  propery: ModelProperty,
  newParam: unknown,
  existingParams: Record<string, unknown>,
  options: TypeNameOptions
): string {
  const parent = propery.model!;
  let key = getTypeName(program, parent, options);

  if (parent.properties.size > 1) {
    key += `.${propery.name}`;
  }

  // JSON check is workaround for https://github.com/microsoft/cadl/issues/462
  if (existingParams[key] && JSON.stringify(newParam) !== JSON.stringify(existingParams[key])) {
    reportDiagnostic(program, {
      code: "duplicate-type-name",
      messageId: "parameter",
      format: {
        value: key,
      },
      target: propery,
    });
  }

  return key;
}

/**
 * Resolve the OpenAPI operation ID for the given operation using the following logic:
 * - If @operationId was specified use that value
 * - If operation is defined at the root or under the service namespace return <operation.name>
 * - Otherwise(operation is under another namespace or interface) return <namespace/interface.name>_<opration.name>
 *
 * @param program Cadl Program
 * @param operation Operation
 * @returns Operation ID in this format <name> or <group>_<name>
 */
export function resolveOperationId(program: Program, operation: Operation) {
  const explicitOperationId = getOperationId(program, operation);
  if (explicitOperationId) {
    return explicitOperationId;
  }

  if (operation.interface) {
    return `${operation.interface.name}_${operation.name}`;
  }
  const namespace = operation.namespace;
  if (
    namespace === undefined ||
    namespace === program.checker.getGlobalNamespaceType() ||
    namespace === getServiceNamespace(program)
  ) {
    return operation.name;
  }

  return `${namespace.name}_${operation.name}`;
}
