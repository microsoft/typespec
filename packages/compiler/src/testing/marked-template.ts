import type {
  ArrayValue,
  BooleanLiteral,
  BooleanValue,
  Entity,
  Enum,
  EnumMember,
  EnumValue,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  NumericLiteral,
  NumericValue,
  ObjectValue,
  Operation,
  Scalar,
  ScalarValue,
  StringLiteral,
  StringValue,
  Type,
  Union,
  UnionVariant,
  Value,
} from "../core/types.js";

export type Marker<T extends Entity, N extends string> = T extends Type
  ? TypeMarker<T, N>
  : T extends Value
    ? ValueMarker<T, N>
    : never;

export interface TypeMarker<T extends Type, N extends string> {
  readonly entityKind: "Type";
  readonly kind?: T["kind"];
  readonly name: N;
}

export interface ValueMarker<T extends Value, N extends string> {
  readonly entityKind: "Value";
  readonly valueKind?: T["valueKind"];
  readonly name: N;
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

/** Specify that this value is dynamic and needs to be interpolated with the given keys */
function code<const T extends (Marker<Entity, string> | string)[]>(
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

/** TypeSpec template marker */
export const t = {
  /**
   * Define a marked code block
   *
   * @example
   * ```ts
   * const code = t.code`model ${t.model("Foo")} { bar: string }`;
   * ```
   */
  code: code,

  // -- Types --

  /** Mark any type */
  type: typeMarker<Type>(),
  /** Mark a model */
  model: typeMarker<Model>("Model"),
  /** Mark an enum */
  enum: typeMarker<Enum>("Enum"),
  /** Mark an union */
  union: typeMarker<Union>("Union"),
  /** Mark an interface */
  interface: typeMarker<Interface>("Interface"),
  /** Mark an operation */
  op: typeMarker<Operation>("Operation"),
  /** Mark an enum member */
  enumMember: typeMarker<EnumMember>("EnumMember"),
  /** Mark a model property */
  modelProperty: typeMarker<ModelProperty>("ModelProperty"),
  /** Mark a namespace */
  namespace: typeMarker<Namespace>("Namespace"),
  /** Mark a scalar */
  scalar: typeMarker<Scalar>("Scalar"),
  /** Mark a union variant */
  unionVariant: typeMarker<UnionVariant>("UnionVariant"),
  /** Mark a boolean literal */
  boolean: typeMarker<BooleanLiteral>("Boolean"),
  /** Mark a number literal */
  number: typeMarker<NumericLiteral>("Number"),
  /** Mark a string literal */
  string: typeMarker<StringLiteral>("String"),

  // -- Values --

  /** Mark any value */
  value: valueMarker<Value>(),
  /** Mark an object value */
  object: valueMarker<ObjectValue>("ObjectValue"),
  /** Mark an array value */
  array: valueMarker<ArrayValue>("ArrayValue"),
  /** Mark a numeric value */
  numericValue: valueMarker<NumericValue>("NumericValue"),
  /** Mark a string value */
  stringValue: valueMarker<StringValue>("StringValue"),
  /** Mark a boolean value */
  booleanValue: valueMarker<BooleanValue>("BooleanValue"),
  /** Mark a scalar value */
  scalarValue: valueMarker<ScalarValue>("ScalarValue"),
  /** Mark an enum value */
  enumValue: valueMarker<EnumValue>("EnumValue"),
};

type Prettify<T extends Record<string, Entity>> = {
  [K in keyof T]: T[K] & Entity;
} & {};

type InferType<T> = T extends Marker<infer K, infer _> ? K : never;
type CollectType<T extends ReadonlyArray<Marker<Entity, string> | string>> = {
  [K in T[number] as K extends Marker<infer _K, infer N> ? N : never]: InferType<K>;
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
