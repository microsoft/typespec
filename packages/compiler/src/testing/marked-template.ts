import {
  Enum,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Type,
  Union,
} from "../core/types.js";

export interface Marker<T extends Type, N extends string> {
  kind: T["kind"];
  name: N;
}

function marker<const T extends Type>(kind: T["kind"]) {
  return <const N extends string>(name: N): Marker<T, N> => {
    return {
      kind,
      name,
    };
  };
}

export const m = {
  model: marker<Model>("Model"),
  enum: marker<Enum>("Enum"),
  union: marker<Union>("Union"),
  interface: marker<Interface>("Interface"),
  op: marker<Operation>("Operation"),
  enumMember: marker<EnumMember>("EnumMember"),
  modelProperty: marker<ModelProperty>("ModelProperty"),
  namespace: marker<Namespace>("Namespace"),
  scalar: marker<Type>("Scalar"),
  unionVariant: marker<Type>("UnionVariant"),
  boolean: marker<Type>("Boolean"),
  number: marker<Type>("Number"),
  string: marker<Type>("String"),
};

export type MarkerConfig<T extends Record<string, Type>> = {
  [K in keyof T]: {
    pos: number;
    end: number;
    kind: T[K]["kind"];
  };
};

export interface TemplateWithMarkers<T extends Record<string, Type>> {
  readonly code: string;
  readonly markers: MarkerConfig<T>;
}

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
type InferType<T> = T extends Marker<infer K, infer _> ? K : never;
type CollectType<T extends ReadonlyArray<Marker<Type, string> | string>> = {
  [K in T[number] as K extends Marker<infer _K, infer N> ? N : never]: InferType<K>;
};
/** Specify that this value is dynamic and needs to be interpolated with the given keys */
export function extract<const T extends (Marker<Type, string> | string)[]>(
  strings: TemplateStringsArray,
  ...keys: T
): TemplateWithMarkers<Prettify<CollectType<T>> & Record<string, Type>> {
  const markers: MarkerConfig<any> = {};
  const result: string[] = [strings[0]];
  let pos = strings[0].length;
  keys.forEach((key, i) => {
    if (typeof key === "string") {
      result.push(key);
      pos += key.length;
    } else {
      result.push(key.name);
      markers[key.name] = {
        pos,
        end: pos + key.name.length,
        kind: key.kind,
      };
      pos += key.name.length;
    }
    result.push(strings[i + 1]);
  });
  return {
    code: result.join(""),
    markers: markers as any,
  };
}

const a = extract`foo ${m.model("bar")} ${"regular"}  ${m.enum("def")}`;
