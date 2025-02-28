import * as ay from "@alloy-js/core";
import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { ScalarDataTransform } from "../data-transform.jsx";
import {
  getJsonArrayTransformRefkey,
  JsonArrayTransform,
  JsonArrayTransformDeclaration,
} from "./json-array-transform.jsx";
import { JsonModelPropertyTransform } from "./json-model-property-transform.jsx";
import {
  getJsonModelTransformRefkey,
  JsonModelTransform,
  JsonModelTransformDeclaration,
} from "./json-model-transform.jsx";
import {
  getJsonRecordTransformRefkey,
  JsonRecordTransform,
  JsonRecordTransformDeclaration,
} from "./json-record-transform.jsx";
import {
  getJsonUnionTransformRefkey,
  JsonUnionTransform,
  JsonUnionTransformDeclaration,
} from "./union-transform.jsx";

export interface JsonTransformProps {
  itemRef: ay.Refkey | ay.Children;
  type: Type;
  target: "transport" | "application";
}

export function JsonTransform(props: JsonTransformProps) {
  const type = $.httpPart.unpack(props.type) ?? props.type;
  const declaredTransform = getTransformReference(type, props.target);

  if (declaredTransform) {
    return ay.code`${declaredTransform}(${props.itemRef})`;
  }

  switch (type.kind) {
    case "Model": {
      if ($.array.is(type)) {
        return <JsonArrayTransform type={type} itemRef={props.itemRef} target={props.target} />;
      }

      if ($.record.is(type)) {
        return <JsonRecordTransform type={type} itemRef={props.itemRef} target={props.target} />;
      }

      return <JsonModelTransform type={type} itemRef={props.itemRef} target={props.target} />;
    }
    case "Union":
      return <JsonUnionTransform type={type} itemRef={props.itemRef} target={props.target} />;
    case "ModelProperty": {
      return <JsonModelPropertyTransform type={type} itemRef={props.itemRef} target={props.target} />;
    }
    case "Scalar": {
      return <ScalarDataTransform type={type} itemRef={props.itemRef} target={props.target}/>;
    }
    default:
      return props.itemRef;
  }
}

export interface JsonTransformDeclarationProps {
  type: Type;
  target: "transport" | "application";
}

export function JsonTransformDeclaration(props: JsonTransformDeclarationProps) {
  if (!$.model.is(props.type) && !$.union.is(props.type)) {
    return null;
  }

  if ($.model.is(props.type)) {
    if ($.array.is(props.type)) {
      return <JsonArrayTransformDeclaration target={props.target} type={props.type} />;
    }

    if ($.record.is(props.type)) {
      return <JsonRecordTransformDeclaration target={props.target} type={props.type}  />;
    }

    return <JsonModelTransformDeclaration type={props.type} target={props.target} />;
  }

  if ($.union.is(props.type)) {
    return <JsonUnionTransformDeclaration target={props.target} type={props.type} />;
  }
}

function getTransformReference(
  type: Type,
  target: "transport" | "application",
): ay.Refkey | undefined {
  if (type.kind === "Model" && Boolean(type.name)) {
    if ($.array.is(type)) {
      return getJsonArrayTransformRefkey(type, target);
    }

    if ($.record.is(type)) {
      return getJsonRecordTransformRefkey(type, target);
    }
    return getJsonModelTransformRefkey(type, target);
  }

  if (type.kind === "Union" && Boolean(type.name)) {
    return getJsonUnionTransformRefkey(type, target);
  }

  return undefined;
}
