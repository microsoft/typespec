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
} from "../types.js";

export interface TypeNameOptions {
  namespaceFilter: (ns: Namespace) => boolean;
}

export function getTypeName(type: Type, options?: TypeNameOptions): string {
  switch (type.kind) {
    case "Namespace":
      return getNamespaceFullName(type, options);
    case "TemplateParameter":
      return type.node.id.sv;
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
      return `${getEnumName(type.enum, options)}.${type.name}`;
    case "Union":
      return type.name || type.options.map((x) => getTypeName(x, options)).join(" | ");
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
  }

  return "(unnamed type)";
}

/**
 * Return the full name of the namespace(e.g. "Foo.Bar")
 * @param type namespace type
 * @param options
 * @returns
 */
export function getNamespaceFullName(type: Namespace, options?: TypeNameOptions): string {
  const filter = options?.namespaceFilter;
  if (filter && !filter(type)) {
    return "";
  }

  return `${getNamespacePrefix(type.namespace, options)}${type.name}`;
}

function getNamespacePrefix(type: Namespace | undefined, options?: TypeNameOptions) {
  const namespaceFullName = type ? getNamespaceFullName(type, options) : "";
  return namespaceFullName !== "" ? namespaceFullName + "." : "";
}

function getEnumName(e: Enum, options: TypeNameOptions | undefined): string {
  return `${getNamespacePrefix(e.namespace, options)}${e.name}`;
}

function getScalarName(scalar: Scalar, options: TypeNameOptions | undefined): string {
  return `${getNamespacePrefix(scalar.namespace, options)}${scalar.name}`;
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
  const modelName = nsPrefix + model.name;
  if (model.templateArguments && model.templateArguments.length > 0) {
    // template instantiation
    const args = model.templateArguments.map((x) => getTypeName(x, options));
    return `${modelName}<${args.join(", ")}>`;
  } else if ((model.node as ModelStatementNode)?.templateParameters?.length > 0) {
    // template
    const params = (model.node as ModelStatementNode).templateParameters.map((t) => t.id.sv);
    return `${model.name}<${params.join(", ")}>`;
  } else {
    // regular old model.
    return modelName;
  }
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
  let interfaceName = iface.name;
  if (iface.templateArguments && iface.templateArguments.length > 0) {
    interfaceName += `<${iface.templateArguments.map((x) => getTypeName(x, options)).join(", ")}>`;
  }
  return `${getNamespacePrefix(iface.namespace, options)}${interfaceName}`;
}

function getOperationName(op: Operation, options: TypeNameOptions | undefined) {
  return `${getNamespacePrefix(op.namespace, options)}${op.name}`;
}
