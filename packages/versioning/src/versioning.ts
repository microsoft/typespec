import { NumericLiteralType, Program, StringLiteralType, Type } from "@cadl-lang/compiler";

const addedOnKey = Symbol();
const removedOnKey = Symbol();
const versionsKey = Symbol();
const renamedFromKey = Symbol();

export function $added(p: Program, t: Type, v: NumericLiteralType) {
  p.stateMap(addedOnKey).set(t, v);
}
export function $removed(p: Program, t: Type, v: NumericLiteralType) {
  p.stateMap(removedOnKey).set(t, v);
}
export function $renamedFrom(
  p: Program,
  t: Type,
  v: NumericLiteralType,
  oldName: StringLiteralType
) {
  const record = { v, oldName };
  p.stateMap(renamedFromKey).set(t, record);
}
export function getRenamedFromVersion(p: Program, t: Type) {
  return p.stateMap(renamedFromKey).get(t)?.v ?? -1;
}
export function getRenamedFromOldName(p: Program, t: Type) {
  return p.stateMap(renamedFromKey).get(t)?.oldName || "";
}
export function getAddedOn(p: Program, t: Type) {
  return p.stateMap(addedOnKey).get(t) || -1;
}
export function getRemovedOn(p: Program, t: Type) {
  return p.stateMap(removedOnKey).get(t) || Infinity;
}

export function $versioned(p: Program, t: Type, v: Type) {
  const versions = [];

  switch (v.kind) {
    case "String":
    case "Number":
      versions.push(v.value);
      break;
    case "Union":
      for (const variant of v.options) {
        if (variant.kind === "String" || variant.kind === "Number") {
          versions.push(variant.value);
        }
      }
      break;
  }

  p.stateMap(versionsKey).set(t, versions);
}

function getVersion(p: Program, t: Type) {
  return p.stateMap(versionsKey).get(t);
}

export function getVersions(p: Program, t: Type): (string | number)[] {
  if (t.kind === "Namespace") {
    const nsVersion = getVersion(p, t);

    if (nsVersion !== undefined) {
      return nsVersion;
    } else if (t.namespace) {
      return getVersions(p, t.namespace);
    } else {
      return [];
    }
  } else if (
    t.kind === "Operation" ||
    t.kind === "Interface" ||
    t.kind === "Model" ||
    t.kind === "Union"
  ) {
    return getVersion(p, t.namespace!);
  } else {
    return [];
  }
}
