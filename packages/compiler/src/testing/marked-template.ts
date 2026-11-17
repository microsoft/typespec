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

/** A named type or value expectation interpolated by {@link t.code} and checked during compilation. */
export type Marker<T extends Entity, N extends string> = T extends Type
  ? TypeMarker<T, N>
  : T extends Value
    ? ValueMarker<T, N>
    : never;

/** Select a type entity and optionally require a particular semantic type kind. */
export interface TypeMarker<T extends Type, N extends string> {
  /** Requires the resolved entity to be a type rather than a runtime value. */
  readonly entityKind: "Type";
  /** Required type kind; when absent, any type kind is accepted. */
  readonly kind?: T["kind"];
  /** Identifier inserted into the source and used as the compilation result key. */
  readonly name: N;
}

/** Select a runtime value entity and optionally require a particular value kind. */
export interface ValueMarker<T extends Value, N extends string> {
  /** Requires the resolved entity to be a runtime value rather than a type. */
  readonly entityKind: "Value";
  /** Required value kind; when absent, any runtime value is accepted. */
  readonly valueKind?: T["valueKind"];
  /** Identifier inserted into the source and used as the compilation result key. */
  readonly name: N;
}

/** Expected entity categories and kinds, keyed by the names collected from a marked template. */
export type MarkerConfig<T extends Record<string, Entity>> = {
  [K in keyof T]: Marker<T[K], K & string>;
};

/** Source produced by {@link t.code}, carrying typed expectations for named entities in that source. */
export interface TemplateWithMarkers<T extends Record<string, Entity>> {
  /** Discriminator identifying a marked template rather than a record of input files. */
  readonly isTemplateWithMarkers: true;
  /** Generated TypeSpec text, including the marker comments used to locate entities. */
  readonly code: string;
  /** Expectations checked when resolving marked entities after compilation. */
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

/**
 * Build TypeSpec source with typed entity markers.
 * Marker factories take an identifier, insert it with a locating comment through {@link t.code},
 * and require the resolved entity to match the factory's type or value kind.
 */
export const t = {
  /**
   * Interpolate source strings and entity markers into a test input with typed result properties.
   * Plain strings are inserted verbatim; a marker named `Foo` inserts `/*Foo*\/Foo`.
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

/**
 * Infer named entity result properties from a marked template or a record of marked input files.
 * Names appearing only in plain source strings are not inferred by this type.
 */
export type GetMarkedEntities<
  M extends string | TemplateWithMarkers<any> | Record<string, string | TemplateWithMarkers<any>>,
> =
  M extends Record<string, string | TemplateWithMarkers<any>>
    ? FlattenTemplates<M>
    : M extends string | TemplateWithMarkers<infer R>
      ? R
      : never;
