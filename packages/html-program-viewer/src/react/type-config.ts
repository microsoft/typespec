import type { Type } from "@typespec/compiler";

export type EntityPropertyConfig = "parent" | "nested" | "ref" | "value" | "skip";

export const TypeConfig: TypeGraphConfig = {
  Namespace: {
    namespaces: "skip",
    models: "nested",
    scalars: "nested",
    interfaces: "nested",
    operations: "nested",
    unions: "nested",
    enums: "nested",
    decoratorDeclarations: "nested",
    functionDeclarations: "nested",
  },
  Interface: {
    operations: "nested",
    sourceInterfaces: "ref",
  },
  Operation: {
    interface: "parent",
    parameters: "nested",
    returnType: "ref",
    sourceOperation: "ref",
  },
  Model: {
    indexer: "skip",
    baseModel: "ref",
    derivedModels: "ref",
    properties: "nested",
    sourceModel: "ref",
    sourceModels: "value",
  },
  Scalar: {
    baseScalar: "ref",
    derivedScalars: "ref",
    constructors: "nested",
  },
  ModelProperty: {
    model: "parent",
    type: "ref",
    optional: "value",
    sourceProperty: "ref",
    default: "value",
    defaultValue: "value",
  },
  Enum: {
    members: "nested",
  },
  EnumMember: {
    enum: "parent",
    sourceMember: "ref",
    value: "value",
  },
  Union: {
    expression: "skip",
    options: "skip",
    variants: "nested",
  },
  UnionVariant: {
    union: "parent",
    type: "ref",
  },
  Boolean: {
    value: "value",
  },
  Decorator: {
    parameters: "nested",
    implementation: "skip",
    target: "ref",
  },
  ScalarConstructor: {
    scalar: "parent",
    parameters: "nested",
  },
  FunctionParameter: null,
  Number: {
    numericValue: "value",
    value: "value",
    valueAsString: "value",
  },
  String: {
    value: "value",
  },
  Tuple: {
    values: "nested",
  },
  StringTemplate: {
    spans: "nested",
    stringValue: "value",
  },
  StringTemplateSpan: {
    isInterpolated: "value",
    type: "skip",
  },
  TemplateParameter: {
    constraint: "value",
    default: "value",
  },

  // Don't want to expose those for now
  Function: null,
  Object: null,
  Intrinsic: null,
  Projection: null,
};

type PropsToDefine<T extends Type> = Exclude<
  keyof T,
  HiddenPropsType | keyof typeof CommonPropsConfig
>;
type TypeConfig<T extends Type> = Record<PropsToDefine<T>, EntityPropertyConfig> | null;
type TypeGraphConfig = {
  [K in Type["kind"]]: TypeConfig<Extract<Type, { kind: K }>>;
};

export const CommonPropsConfig = {
  namespace: "parent",
};

const HiddenProps = [
  "entityKind",
  "kind",
  "name",
  "node",
  "symbol",
  "templateNode",
  "templateArguments",
  "templateMapper",
  "instantiationParameters",
  "decorators",
  "projectionBase",
  "projectionsByName",
  "projectionSource",
  "projector",
  "projections",
  "isFinished",
] as const;
type HiddenPropsType = (typeof HiddenProps)[number];

export const HiddenPropsSet = new Set(HiddenProps);

export function getPropertyRendering<T extends Type, K extends keyof T>(
  type: T,
  key: K,
): EntityPropertyConfig {
  const properties = (TypeConfig as any)[type.kind];
  const action = properties?.[key] ?? (CommonPropsConfig as any)[key];
  return action;
}
