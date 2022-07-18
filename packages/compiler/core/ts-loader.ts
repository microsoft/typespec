import ts from "typescript";
import { CompilerHost, Type } from "./types.js";

export interface TSLoader {
  getExportedFunctionsFromDTS(definitionFile: string): Record<string, DecoratorSignature>;
}

export function createTSLoader(cadlHost: CompilerHost): TSLoader {
  const tsHost = ts.createCompilerHost({});

  return {
    getExportedFunctionsFromDTS,
  };

  function getExportedFunctionsFromDTS(definitionFile: string): Record<string, DecoratorSignature> {
    const program = ts.createProgram({ rootNames: [definitionFile], options: {}, host: tsHost });
    const files = program.getSourceFiles().filter((x) => x.fileName === definitionFile);

    const checker = program.getTypeChecker();
    return getExportedDecoratorsSignatures(checker, files[0]);
  }
}

function getExportedDecoratorsSignatures(
  checker: ts.TypeChecker,
  file: ts.SourceFile
): Record<string, DecoratorSignature> {
  const moduleSymbol = checker.getSymbolAtLocation(file);
  const exportedSymbols = checker.getExportsOfModule(moduleSymbol!);
  const signatures: Record<string, DecoratorSignature> = {};

  for (const symbol of exportedSymbols) {
    if (symbol.flags & ts.SymbolFlags.Function && symbol.name[0] === "$") {
      const node = symbol.declarations?.[0];
      const type = checker.getTypeOfSymbolAtLocation(symbol, node!);
      const signature = getDecoratorSignature(checker, type);
      if (signature) {
        signatures[symbol.name] = signature;
      }
    }
  }
  return signatures;
}

export interface DecoratorParameter {
  kind: Type["kind"][] | undefined;
  optional?: boolean;
}

export interface DecoratorSignature {
  name: string;
  target: Type["kind"][] | undefined;
  args: DecoratorParameter[];
}

function getDecoratorSignature(
  checker: ts.TypeChecker,
  functionType: ts.Type
): DecoratorSignature | undefined {
  const signatures = checker.getSignaturesOfType(functionType, ts.SignatureKind.Call);
  if (signatures.length === 0) {
    return undefined;
  }
  const signature = signatures[0];
  const [_contextParam, targetParam, ...parameters] = signature.parameters;

  const decoratorSignature: DecoratorSignature = {
    name: functionType.symbol.name.replace("$", "@"),
    target: getCadlTypesForParameter(checker, targetParam).kind,
    args: parameters.map((x) => getCadlTypesForParameter(checker, x)),
  };

  return decoratorSignature;
}

function getCadlTypesForParameter(
  checker: ts.TypeChecker,
  paramSymbol: ts.Symbol
): DecoratorParameter {
  const node = paramSymbol.declarations?.[0];
  if (node === undefined) {
    return { kind: undefined };
  }
  const type = checker.getTypeOfSymbolAtLocation(paramSymbol, node);
  const optional = checker.isOptionalParameter(node as ts.ParameterDeclaration);
  return { kind: getCadlTypesForTsType(type), optional };
}

function getCadlTypesForTsType(tsType: ts.Type): Type["kind"][] | undefined {
  if (tsType.flags & ts.TypeFlags.Union) {
    return getCadlTypeForTsUnion(tsType as ts.UnionType);
  } else if (tsType.flags & ts.TypeFlags.String) {
    return ["String"];
  } else if (tsType.flags & ts.TypeFlags.Boolean) {
    return ["Boolean"];
  } else if (tsType.flags & ts.TypeFlags.Number) {
    return ["Number"];
  } else {
    const type = getCadlTypeKindFromTsType(tsType);
    return type ? [type] : undefined;
  }
}

function getCadlTypeForTsUnion(tsUnion: ts.UnionType): Type["kind"][] | undefined {
  const types: Type["kind"][] = [];
  for (const tsChoice of tsUnion.types) {
    const type = getCadlTypesForTsType(tsChoice);
    if (type === undefined) {
      return undefined;
    }
    types.push(...type);
  }
  return types;
}

function getCadlTypeKindFromTsType(tsType: ts.Type): Type["kind"] | undefined {
  const name = tsType.symbol?.name;
  if (name === undefined) {
    return undefined;
  }
  return CadlTypeNameKindMap[name];
}

const CadlTypeNameKindMap: Record<string, Type["kind"]> = {
  ModelType: "Model",
  ModelPropertyType: "ModelProperty",
  InterfaceType: "Interface",
  EnumType: "Enum",
  EnumMemberType: "EnumMember",
  TemplateParameterType: "TemplateParameter",
  NamespaceType: "Namespace",
  OperationType: "Operation",
  StringType: "String",
  NumberType: "Number",
  BooleanType: "Boolean",
  ArrayType: "Array",
  TupleType: "Tuple",
  UnionType: "Union",
  UnionVariantType: "UnionVariant",
  IntrinsicType: "Intrinsic",
  FunctionType: "Function",
  ObjectType: "Object",
  ProjectionType: "Projection",
};
