import { Enum, Model, Scalar, Type, Union, navigateType } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { Client } from "../interfaces.js";

export type DataType = Model | Union | Enum | Scalar;

export function discoverDataTypes(client: Client) {
  const types = new Set<DataType>();
  const ns = client.type;

  const constructor = $.client.getConstructor(client);

  discover(constructor.parameters, types);
  navigateType(
    ns,
    {
      operation(o) {
        discover(o, types);
      },
    },
    { includeTemplateDeclaration: false },
  );

  const dataTypes = Array.from(types);

  return dataTypes;
}

function discover(type: Type, types: Set<DataType>) {
  navigateType(
    type,
    {
      model(m) {
        trackType(types, m);
      },
      modelProperty(p) {
        trackType(types, p.type);
      },
      scalar(s) {
        if (s.namespace?.name !== "TypeSpec") {
          return;
        }

        trackType(types, s);
      },
      enum(e) {
        trackType(types, e);
      },
      union(u) {
        trackType(types, u);
      },
      unionVariant(v) {
        trackType(types, v.type);
      },
    },
    { includeTemplateDeclaration: false },
  );
}

function isDataType(type: Type): type is DataType {
  return (
    type.kind === "Model" || type.kind === "Union" || type.kind === "Enum" || type.kind === "Scalar"
  );
}

function isDeclaredType(type: Type): boolean {
  if ("namespace" in type && type.namespace?.name === "TypeSpec") {
    return false;
  }

  if (!isDataType(type)) {
    return false;
  }

  if (type.name === undefined || type.name === "") {
    return false;
  }

  return true;
}

function trackType(types: Set<DataType>, type: Type) {
  if (!isDataType(type)) {
    return;
  }

  if (!isDeclaredType(type)) {
    return;
  }

  types.add(type);
}
