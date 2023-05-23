import {
  Decorator,
  FunctionParameter,
  Model,
  Namespace,
  Program,
  Type,
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

  function getTSParmeterType(type: Type, isTarget?: boolean): string {
    if (isTarget && isUnknownType(type)) {
      return useCompilerType("Type");
    }
    if (type.kind === "Model" && isReflectionType(type)) {
      return useCompilerType(type.name);
    }
    return "unknown";
  }
}

function isReflectionType(type: Type): type is Model {
  return (
    type.kind === "Model" &&
    type.namespace?.name === "Reflection" &&
    type.namespace?.namespace?.name === "TypeSpec"
  );
}
