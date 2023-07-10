import { printId } from "../../formatter/print/printer.js";
import { isTemplateInstance } from "../type-utils.js";
import {
  Enum,
  Interface,
  Model,
  ModelProperty,
  ModelStatementNode,
  Namespace,
  Operation,
  Scalar,
  Type,
  Union,
  ValueType,
} from "../types.js";

export interface TypeNameOptions {
  namespaceFilter?: (ns: Namespace) => boolean;
  printable?: boolean;
}

export function getTypeName(type: Type | ValueType, options?: TypeNameOptions): string {
  switch (type.kind) {
    case "Namespace":
      return getNamespaceFullName(type, options);
    case "TemplateParameter":
      return getIdentifierName(type.node.id.sv, options);
    case "Scalar":
      return getScalarName(type, options);
    case "Model":
      return getModelName(type, options);
    case "ModelProperty":
      return getModelPropertyName(type, options);
    case "Interface":
      return getInterfaceName(type, options);
    case "Operation":
      return getOperationName(type, options);
    case "Enum":
      return getEnumName(type, options);
    case "EnumMember":
      return `${getEnumName(type.enum, options)}.${getIdentifierName(type.name, options)}`;
    case "Union":
      return getUnionName(type, options);
    case "UnionVariant":
      return getTypeName(type.type, options);
    case "Tuple":
      return "[" + type.values.map((x) => getTypeName(x, options)).join(", ") + "]";
    case "String":
    case "Number":
    case "Boolean":
      return type.value.toString();
    case "Intrinsic":
      return type.name;
    case "Value":
      return `valueof ${getTypeName(type.target, options)}`;
  }

  return "(unnamed type)";
}

export function isStdNamespace(namespace: Namespace): boolean {
  return (
    (namespace.name === "TypeSpec" && namespace.namespace?.name === "") ||
    (namespace.name === "Reflection" &&
      namespace.namespace?.name === "TypeSpec" &&
      namespace.namespace?.namespace?.name === "")
  );
}

/**
 * Return the full name of the namespace(e.g. "Foo.Bar")
 * @param type namespace type
 * @param options
 * @returns
 */
export function getNamespaceFullName(type: Namespace, options?: TypeNameOptions): string {
  const filter = options?.namespaceFilter;
  const segments = [];
  let current: Namespace | undefined = type;
  while (current && current.name !== "") {
    if (filter && !filter(current)) {
      break;
    }
    segments.unshift(getIdentifierName(current.name, options));
    current = current.namespace;
  }

  return segments.join(".");
}

function getNamespacePrefix(type: Namespace | undefined, options?: TypeNameOptions) {
  if (type === undefined || isStdNamespace(type)) {
    return "";
  }
  const namespaceFullName = getNamespaceFullName(type, options);
  return namespaceFullName !== "" ? namespaceFullName + "." : "";
}

function getEnumName(e: Enum, options: TypeNameOptions | undefined): string {
  return `${getNamespacePrefix(e.namespace, options)}${getIdentifierName(e.name, options)}`;
}

function getScalarName(scalar: Scalar, options: TypeNameOptions | undefined): string {
  return `${getNamespacePrefix(scalar.namespace, options)}${getIdentifierName(
    scalar.name,
    options
  )}`;
}

function getModelName(model: Model, options: TypeNameOptions | undefined) {
  const nsPrefix = getNamespacePrefix(model.namespace, options);
  if (model.name === "" && model.properties.size === 0) {
    return "{}";
  }
  if (model.indexer && model.indexer.key.kind === "Scalar") {
    if (model.name === "Array" && isInTypeSpecNamespace(model)) {
      return `${getTypeName(model.indexer.value!, options)}[]`;
    }
  }

  if (model.name === "") {
    return nsPrefix + "(anonymous model)";
  }
  const modelName = nsPrefix + getIdentifierName(model.name, options);
  if (isTemplateInstance(model)) {
    // template instantiation
    const args = model.templateMapper.args.map((x) => getTypeName(x, options));
    return `${modelName}<${args.join(", ")}>`;
  } else if ((model.node as ModelStatementNode)?.templateParameters?.length > 0) {
    // template
    const params = (model.node as ModelStatementNode).templateParameters.map((t) =>
      getIdentifierName(t.id.sv, options)
    );
    return `${modelName}<${params.join(", ")}>`;
  } else {
    // regular old model.
    return modelName;
  }
}

function getUnionName(type: Union, options: TypeNameOptions | undefined): string {
  const nsPrefix = getNamespacePrefix(type.namespace, options);
  const typeName = type.name
    ? getIdentifierName(type.name, options)
    : [...type.variants.values()].map((x) => getTypeName(x.type, options)).join(" | ");
  return nsPrefix + typeName;
}

/**
 * Check if the given namespace is the standard library `TypeSpec` namespace.
 */
function isTypeSpecNamespace(
  namespace: Namespace
): namespace is Namespace & { name: "TypeSpec"; namespace: Namespace } {
  return namespace.name === "TypeSpec" && namespace.namespace?.name === "";
}

/**
 * Check if the given type is defined right in the TypeSpec namespace.
 */
function isInTypeSpecNamespace(type: Type & { namespace?: Namespace }): boolean {
  return Boolean(type.namespace && isTypeSpecNamespace(type.namespace));
}

function getModelPropertyName(prop: ModelProperty, options: TypeNameOptions | undefined) {
  const modelName = prop.model ? getModelName(prop.model, options) : undefined;

  return `${modelName ?? "(anonymous model)"}.${prop.name}`;
}

function getInterfaceName(iface: Interface, options: TypeNameOptions | undefined) {
  let interfaceName = getIdentifierName(iface.name, options);
  if (isTemplateInstance(iface)) {
    interfaceName += `<${iface.templateMapper.args
      .map((x) => getTypeName(x, options))
      .join(", ")}>`;
  }
  return `${getNamespacePrefix(iface.namespace, options)}${interfaceName}`;
}

function getOperationName(op: Operation, options: TypeNameOptions | undefined) {
  return `${getNamespacePrefix(op.namespace, options)}${getIdentifierName(op.name, options)}`;
}

function getIdentifierName(name: string, options: TypeNameOptions | undefined) {
  return options?.printable ? printId(name) : name;
}
