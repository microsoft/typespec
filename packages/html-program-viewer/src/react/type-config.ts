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
};
