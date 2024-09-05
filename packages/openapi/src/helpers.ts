import {
  getFriendlyName,
  getTypeName,
  getVisibility,
  isGlobalNamespace,
  isService,
  isTemplateInstance,
  ModelProperty,
  Operation,
  Program,
  Type,
  TypeNameOptions,
} from "@typespec/compiler";
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
      return !type.name || isTemplateInstance(type);
    case "Scalar":
      return program.checker.isStdType(type) || isTemplateInstance(type);
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
 * For inlined types: this is the TypeSpec-native name written to `x-typespec-name`.
 *
 * For non-inlined types: this is either the friendly name or the TypeSpec-native name.
 *
 * TypeSpec-native names are shortened to exclude root `TypeSpec` namespace and service
 * namespace using the provided `TypeNameOptions`.
 */
export function getOpenAPITypeName(
  program: Program,
  type: Type,
  options: TypeNameOptions,
  existing?: Record<string, any>
): string {
  const name = getFriendlyName(program, type) ?? getTypeName(type, options);

  checkDuplicateTypeName(program, type, name, existing);
  return name;
}

/**
 * Check the given name is not already specific in the existing map. Report a diagnostic if it is.
 * @param program  Program
 * @param type Type with the name to check
 * @param name Name to check
 * @param existing Existing map of name
 */
export function checkDuplicateTypeName(
  program: Program,
  type: Type,
  name: string,
  existing: Record<string, unknown> | undefined
) {
  if (existing && existing[name]) {
    reportDiagnostic(program, {
      code: "duplicate-type-name",
      format: {
        value: name,
      },
      target: type,
    });
  }
}

/**
 * Gets the key that is used to define a parameter in OpenAPI.
 */
export function getParameterKey(
  program: Program,
  property: ModelProperty,
  newParam: unknown,
  existingParams: Record<string, unknown>,
  options: TypeNameOptions
): string {
  const parent = property.model!;
  let key = getOpenAPITypeName(program, parent, options);

  if (parent.properties.size > 1) {
    key += `.${property.name}`;
  }

  if (existingParams[key]) {
    reportDiagnostic(program, {
      code: "duplicate-type-name",
      messageId: "parameter",
      format: {
        value: key,
      },
      target: property,
    });
  }

  return key;
}

/**
 * Resolve the OpenAPI operation ID for the given operation using the following logic:
 * - If `@operationId` was specified use that value
 * - If operation is defined at the root or under the service namespace return `<operation.name>`
 * - Otherwise(operation is under another namespace or interface) return `<namespace/interface.name>_<operation.name>`
 *
 * @param program TypeSpec Program
 * @param operation Operation
 * @returns Operation ID in this format `<name>` or `<group>_<name>`
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
    isGlobalNamespace(program, namespace) ||
    isService(program, namespace)
  ) {
    return operation.name;
  }

  return `${namespace.name}_${operation.name}`;
}

/**
 * Determines if a property is read-only, which is defined as being
 * decorated `@visibility("read")`.
 *
 * If there is more than 1 `@visibility` argument, then the property is not
 * read-only. For example, `@visibility("read", "update")` does not
 * designate a read-only property.
 */
export function isReadonlyProperty(program: Program, property: ModelProperty) {
  const visibility = getVisibility(program, property);
  // note: multiple visibilities that include read are not handled using
  // readonly: true, but using separate schemas.
  return visibility?.length === 1 && visibility[0] === "read";
}
