import type { Entity, Type } from "@typespec/compiler";

export type PropertyRendering<T> =
  | { kind: "parent" | "nested-items" | "ref" | "value" | "skip" }
  | NestedPropertyRendering<T>;
export type PropertyRenderingRaw<T> =
  | "parent"
  | "nested-items"
  | "ref"
  | "value"
  | "skip"
  | NestedPropertyRenderingRaw<T>;

export type PropertiesRenderingRaw<T> = { [K in keyof T]: PropertyRenderingRaw<T[K]> };
export type PropertiesRendering<T> = { [K in keyof T]: PropertyRendering<T[K]> };

export type NestedPropertyRendering<T> = {
  kind: "nested";
  properties: PropertiesRendering<T>;
};
export type NestedPropertyRenderingRaw<T> = {
  kind: "nested";
  properties: PropertiesRenderingRaw<T>;
};

export const CommonPropsConfig = {
  namespace: "parent",
  name: "value",
};

const HiddenProps = [
  "entityKind",
  "kind",
  "node",
  "symbol",
  "templateNode",
  "templateArguments",
  "templateMapper",
  "instantiationParameters",
  "decorators",
  "isFinished",
] as const;

const HiddenPropsConfig = Object.fromEntries(HiddenProps.map((prop) => [prop, "skip"])) as Record<
  HiddenPropsType,
  "skip"
>;

export const TypeConfig: TypeGraphConfig = buildConfig({
  Namespace: {
    namespaces: "skip",
    models: "nested-items",
    scalars: "nested-items",
    interfaces: "nested-items",
    operations: "nested-items",
    unions: "nested-items",
    enums: "nested-items",
    decoratorDeclarations: "nested-items",
  },
  Interface: {
    operations: "nested-items",
    sourceInterfaces: "ref",
  },
  Operation: {
    interface: "parent",
    parameters: "nested-items",
    returnType: "ref",
    sourceOperation: "ref",
  },
  Model: {
    indexer: {
      kind: "nested",
      properties: {
        key: "ref",
        value: "ref",
      },
    },
    baseModel: "ref",
    derivedModels: "ref",
    properties: "nested-items",
    sourceModel: "ref",
    sourceModels: "value",
  },
  Scalar: {
    baseScalar: "ref",
    derivedScalars: "ref",
    constructors: "nested-items",
  },
  ModelProperty: {
    model: "parent",
    type: "ref",
    optional: "value",
    sourceProperty: "ref",
    defaultValue: "value",
  },
  Enum: {
    members: "nested-items",
  },
  EnumMember: {
    enum: "parent",
    sourceMember: "ref",
    value: "value",
  },
  Union: {
    expression: "value",
    variants: "nested-items",
  },
  UnionVariant: {
    union: "parent",
    type: "ref",
  },
  Boolean: {
    value: "value",
  },
  Decorator: {
    parameters: "nested-items",
    implementation: "skip",
    target: "ref",
  },
  ScalarConstructor: {
    scalar: "parent",
    parameters: "nested-items",
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
    values: "nested-items",
  },
  StringTemplate: {
    spans: "nested-items",
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
  Intrinsic: null,
});

type PropsToDefine<T extends Type> = Omit<T, HiddenPropsType | keyof typeof CommonPropsConfig>;
type TypeRawConfig<T extends Type> = PropertiesRenderingRaw<PropsToDefine<T>> | null;
type TypeGraphRawConfig = {
  [K in Type["kind"]]: TypeRawConfig<Extract<Type, { kind: K }>>;
};
type TypeConfig<T extends Type> = PropertiesRendering<T> | null;
type TypeGraphConfig = {
  [K in Type["kind"]]: TypeConfig<Extract<Type, { kind: K }>>;
};

type HiddenPropsType = (typeof HiddenProps)[number];

export const HiddenPropsSet = new Set(HiddenProps);

export function getPropertyRendering<T extends Type, K extends keyof T>(
  type: T,
  key: K,
): PropertyRenderingRaw<T> {
  const properties = (TypeConfig as any)[type.kind];
  const action = properties?.[key] ?? (CommonPropsConfig as any)[key];
  return action;
}
export function getRenderingConfig<T extends Entity>(type: T): PropertiesRendering<T> | null {
  return (TypeConfig as any)[(type as any).kind];
}

function buildConfig(raw: TypeGraphRawConfig): TypeGraphConfig {
  return Object.fromEntries(
    Object.entries(raw).map(([kind, config]) => {
      return [kind, buildConfigForKind(config as any)];
    }),
  ) as any;
}

function buildConfigForKind<T extends Type>(config: TypeRawConfig<T> | null): TypeConfig<T> | null {
  if (config === null) {
    return null;
  }
  return Object.fromEntries(
    Object.entries({ ...CommonPropsConfig, ...HiddenPropsConfig, ...config }).map(
      ([key, value]) => {
        return [key, buildConfigForProperty(value as any)];
      },
    ),
  ) as any;
}

function buildConfigForProperty<T extends Type>(
  value: PropertyRenderingRaw<T>,
): PropertyRendering<T> {
  if (typeof value === "string") {
    return { kind: value };
  }
  return {
    kind: "nested",
    properties: buildConfigForKind(value.properties) as PropertiesRendering<T>,
  };
}
