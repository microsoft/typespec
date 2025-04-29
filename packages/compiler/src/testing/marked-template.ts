import {
  Enum,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
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
};

export type MarkerConfig<T extends Record<string, Type>> = {
  [K in keyof T]: T[K]["kind"];
};

export interface TemplateWithMarkers<T extends Record<string, Type>> {
  readonly code: string;
  readonly markers: MarkerConfig<T>;
}

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type PickMarkers<T extends (Marker<Type, string> | string)[]> = T extends (infer U)[]
  ? U extends Marker<infer K, infer N>
    ? { [key in N]: K }
    : never
  : never;

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void
  ? I
  : never;

/** Specify that this value is dynamic and needs to be interpolated with the given keys */
export function extract<const T extends (Marker<Type, string> | string)[]>(
  strings: TemplateStringsArray,
  ...keys: T
): TemplateWithMarkers<Prettify<UnionToIntersection<PickMarkers<T>>> & Record<string, Type>> {
  const markers: Marker<Type, string>[] = [];
  const result: string[] = [strings[0]];
  keys.forEach((key, i) => {
    if (typeof key === "string") {
      result.push(key);
    } else {
      result.push(key.name);
      markers.push(key as Marker<Type, string>);
    }
    result.push(strings[i + 1]);
  });
  return {
    code: result.join(""),
    markers: markers as any,
  };
}

const a = extract`foo ${m.model("bar")} ${"regular"}  ${m.enum("def")}`;
