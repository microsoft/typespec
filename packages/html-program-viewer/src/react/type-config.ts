export const TypeConfig = {
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
  Interace: {
    operations: "nested",
    sourceInterfaces: "ref",
  },
  Operation: {
    interface: "skip",
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
    model: "skip",
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
    enum: "skip",
    sourceMember: "ref",
    value: "value",
  },
  Union: {
    expression: "skip",
    options: "skip",
    variants: "nested",
  },
  UnionVariant: {
    union: "skip",
    type: "ref",
  },
};

const HiddenProps = [
  "entityKind",
  "kind",
  "name",
  "node",
  "symbol",
  "namespace",
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

export const HiddenPropsSet = new Set(HiddenProps);
