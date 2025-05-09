import {
  Entity,
  Enum,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Type,
  Union,
  Value,
} from "../core/types.js";

export type Marker<T extends Entity, N extends string> = T extends Type
  ? TypeMarker<T, N>
  : T extends Value
    ? ValueMarker<T, N>
    : never;

export interface TypeMarker<T extends Type, N extends string> {
  entityKind: "Type";
  kind?: T["kind"];
  name: N;
}

export interface ValueMarker<T extends Value, N extends string> {
  entityKind: "Value";
  valueKind?: T["valueKind"];
  name: N;
}

function typeMarker<const T extends Type>(kind?: T["kind"]) {
  return <const N extends string>(name: N): TypeMarker<T, N> => {
    return {
      entityKind: "Type",
      kind,
      name,
    };
  };
}

function valueMarker<const T extends Value>(valueKind?: T["valueKind"]) {
  return <const N extends string>(name: N): ValueMarker<T, N> => {
    return {
      entityKind: "Value",
      valueKind,
      name,
    };
  };
}

export type MarkerConfig<T extends Record<string, Entity>> = {
  [K in keyof T]: Marker<T[K], K & string>;
};

export interface TemplateWithMarkers<T extends Record<string, Entity>> {
  readonly isTemplateWithMarkers: true;
  readonly code: string;
  readonly markers: MarkerConfig<T>;
}

export const TemplateWithMarkers = {
  is: (value: unknown): value is TemplateWithMarkers<any> => {
    return typeof value === "object" && value !== null && "isTemplateWithMarkers" in value;
  },
};

type Prettify<T extends Record<string, Entity>> = {
  [K in keyof T]: T[K] & Entity;
} & {};

type InferType<T> = T extends Marker<infer K, infer _> ? K : never;
type CollectType<T extends ReadonlyArray<Marker<Entity, string> | string>> = {
  [K in T[number] as K extends Marker<infer _K, infer N> ? N : never]: InferType<K>;
};
/** Specify that this value is dynamic and needs to be interpolated with the given keys */
function extract<const T extends (Marker<Entity, string> | string)[]>(
  strings: TemplateStringsArray,
  ...keys: T
): TemplateWithMarkers<Prettify<CollectType<T>>> {
  const markers: MarkerConfig<any> = {};
  const result: string[] = [strings[0]];
  keys.forEach((key, i) => {
    if (typeof key === "string") {
      result.push(key);
    } else {
      result.push(`/*${key.name}*/${key.name}`);
      markers[key.name] = {
        entityKind: key.entityKind,
        name: key.name,
        kind: (key as any).kind,
        valueKind: (key as any).valueKind,
      };
    }
    result.push(strings[i + 1]);
  });
  return {
    isTemplateWithMarkers: true,
    code: result.join(""),
    markers: markers as any,
  };
}

/** TypeSpec template marker */
export const t = {
  code: extract,

  // Types
  type: typeMarker<Type>(),
  model: typeMarker<Model>("Model"),
  enum: typeMarker<Enum>("Enum"),
  union: typeMarker<Union>("Union"),
  interface: typeMarker<Interface>("Interface"),
  op: typeMarker<Operation>("Operation"),
  enumMember: typeMarker<EnumMember>("EnumMember"),
  modelProperty: typeMarker<ModelProperty>("ModelProperty"),
  namespace: typeMarker<Namespace>("Namespace"),
  scalar: typeMarker<Type>("Scalar"),
  unionVariant: typeMarker<Type>("UnionVariant"),
  boolean: typeMarker<Type>("Boolean"),
  number: typeMarker<Type>("Number"),
  string: typeMarker<Type>("String"),

  // Values
  value: valueMarker<Value>(),
  object: valueMarker<Value>("ObjectValue"),
  array: valueMarker<Value>("ArrayValue"),
};

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

type FlattenRecord<T extends Record<string, unknown>> = UnionToIntersection<T[keyof T]>;

type FlattenTemplates<M extends Record<string, string | TemplateWithMarkers<any>>> = FlattenRecord<{
  [K in keyof M]: M[K] extends TemplateWithMarkers<infer T> ? T : never;
}>;

export type GetMarkedEntities<
  M extends string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
> =
  M extends Record<string, string | TemplateWithMarkers<any>>
    ? FlattenTemplates<M>
    : M extends string | TemplateWithMarkers<infer R>
      ? R
      : never;
