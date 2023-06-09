import {
  Decorator,
  FunctionParameter,
  IntrinsicScalarName,
  Model,
  Namespace,
  Program,
  Scalar,
  Type,
  ValueType,
  ignoreDiagnostics,
  isUnknownType,
  navigateTypesInNamespace,
} from "../core/index.js";

export function generateDecoratorTSSignature(
  program: Program,
  filterToNamespace: string[]
): string {
  const namespaceTypes = filterToNamespace
    .map((x) => ignoreDiagnostics(program.resolveTypeReference(x)))
    .filter((x): x is Namespace => x !== undefined);

  const compilerImports = new Set<string>();
  const decoratorDeclarations: string[] = [];

  for (const namespace of namespaceTypes) {
    navigateTypesInNamespace(
      namespace,
      {
        decorator(dec) {
          decoratorDeclarations.push(getTSSignatureForDecorator(dec));
        },
      },
      { includeTemplateDeclaration: true, skipSubNamespaces: true }
    );
  }

  return [
    `import {${[...compilerImports].join(",")}} form "@typespec/compiler";`,
    "",
    ...decoratorDeclarations,
  ].join("\n");

  function useCompilerType(name: string) {
    compilerImports.add(name);
    return name;
  }

  function getTSSignatureForDecorator(decorator: Decorator): string {
    const name = decorator.name[1].toUpperCase() + decorator.name.slice(2) + "Decorator";
    const args =
      decorator.parameters.length > 0
        ? `,${decorator.parameters.map((x) => getTSParameter(x)).join(",")}`
        : "";
    return `export type ${name} = (${getTSParameter(decorator.target, true)}${args}) => void;`;
  }

  function getTSParameter(param: FunctionParameter, isTarget?: boolean): string {
    const optional = param.optional ? "?" : "";
    return `${param.name}${optional}: ${getTSParmeterType(param.type, isTarget)}`;
  }

  function getTSParmeterType(type: Type | ValueType, isTarget?: boolean): string {
    if (type.kind === "Value") {
      console.log("Target", type);
      return getValueTSType(type.target);
    }
    if (isTarget && isUnknownType(type)) {
      return useCompilerType("Type");
    }
    if (type.kind === "Model" && isReflectionType(type)) {
      return useCompilerType(type.name);
    }
    return "unknown";
  }

  function getValueTSType(type: Type): string {
    switch (type.kind) {
      case "Boolean":
        return `${type.value}`;
      case "String":
        return `"${type.value}"`;
      case "Number":
        return `${type.value}`;
      case "Scalar":
        return getScalarTSType(type);
    }
    return "unknown";
  }

  function getScalarTSType(scalar: Scalar): string {
    const isStd = program.checker.isStdType(scalar);
    if (isStd) {
      return getStdScalarTSType(scalar);
    } else if (scalar.baseScalar) {
      return getScalarTSType(scalar.baseScalar);
    } else {
      return "unknown";
    }
  }

  function getStdScalarTSType(scalar: Scalar & { name: IntrinsicScalarName }): string {
    switch (scalar.name) {
      case "numeric":
      case "integer":
      case "int8":
      case "int16":
      case "int32":
      case "int64":
      case "safeint":
      case "uint8":
      case "uint16":
      case "uint32":
      case "uint64":
      case "float":
      case "float64":
      case "float32":
      case "decimal":
      case "decimal128":
        return "number";
      case "string":
      case "url":
        return "string";
      case "boolean":
        return "boolean";
      case "plainDate":
      case "utcDateTime":
      case "offsetDateTime":
      case "plainTime":
      case "duration":
      case "bytes":
        return "unknown";
      default:
        const _assertNever: never = scalar.name;
        return "unknown";
    }
  }
}

function isReflectionType(type: Type): type is Model {
  return (
    type.kind === "Model" &&
    type.namespace?.name === "Reflection" &&
    type.namespace?.namespace?.name === "TypeSpec"
  );
}
