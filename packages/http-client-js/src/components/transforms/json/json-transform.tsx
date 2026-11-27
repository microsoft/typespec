import type { Refkey } from "@alloy-js/core";
import { code } from "@alloy-js/core";
import type { Children } from "@alloy-js/core/jsx-runtime";
import type { Type } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import {
  getArrayTransformRefkey,
  getModelTransformRefkey,
  getRecordTransformRefkey,
  getSerializerTransformKind,
  getUnionTransformRefkey,
  type SerializerTransformKind,
} from "../../../utils/serializer-transform.js";
import { ScalarDataTransform } from "../data-transform.jsx";
import {
  JsonArrayTransform,
  JsonArrayTransformDeclaration,
} from "./json-array-transform.jsx";
import { JsonModelPropertyTransform } from "./json-model-property-transform.jsx";
import {
  JsonModelTransform,
  JsonModelTransformDeclaration,
} from "./json-model-transform.jsx";
import {
  JsonRecordTransform,
  JsonRecordTransformDeclaration,
} from "./json-record-transform.jsx";
import {
  JsonUnionTransform,
  JsonUnionTransformDeclaration,
} from "./union-transform.jsx";

export interface JsonTransformProps {
  itemRef: Refkey | Children;
  type: Type;
  target: "transport" | "application";
  /** When set to a form media type, use form-specific serializers instead of JSON. */
  serializationMediaType?: string;
}

export function JsonTransform(props: JsonTransformProps) {
  const { $ } = useTsp();
  const type = $.httpPart.unpack(props.type) ?? props.type;
  const serializerKind = getSerializerTransformKind(props.serializationMediaType);
  const declaredTransform = getTransformReference(type, props.target, serializerKind);

  if (declaredTransform) {
    return code`${declaredTransform}(${props.itemRef})`;
  }

  switch (type.kind) {
    case "Model": {
      if ($.array.is(type)) {
        return (
          <JsonArrayTransform
            type={type}
            itemRef={props.itemRef}
            target={props.target}
            serializerKind={serializerKind}
          />
        );
      }

      if ($.record.is(type)) {
        return (
          <JsonRecordTransform
            type={type}
            itemRef={props.itemRef}
            target={props.target}
            serializerKind={serializerKind}
          />
        );
      }

      return (
        <JsonModelTransform
          type={type}
          itemRef={props.itemRef}
          target={props.target}
          serializerKind={serializerKind}
        />
      );
    }
    case "Union":
      return (
        <JsonUnionTransform
          type={type}
          itemRef={props.itemRef}
          target={props.target}
          serializerKind={serializerKind}
        />
      );
    case "ModelProperty": {
      return (
        <JsonModelPropertyTransform
          type={type}
          itemRef={props.itemRef}
          target={props.target}
          serializationMediaType={props.serializationMediaType}
        />
      );
    }
    case "Scalar": {
      return <ScalarDataTransform type={type} itemRef={props.itemRef} target={props.target} />;
    }
    default:
      return props.itemRef;
  }
}

export interface JsonTransformDeclarationProps {
  type: Type;
  target: "transport" | "application";
  serializerKind?: SerializerTransformKind;
}

export function JsonTransformDeclaration(props: JsonTransformDeclarationProps) {
  const { $ } = useTsp();
  const serializerKind = props.serializerKind ?? "json";
  if (!$.model.is(props.type) && !$.union.is(props.type)) {
    return null;
  }

  if ($.model.is(props.type)) {
    if ($.array.is(props.type)) {
      return (
        <JsonArrayTransformDeclaration
          target={props.target}
          type={props.type}
          serializerKind={serializerKind}
        />
      );
    }

    if ($.record.is(props.type)) {
      return (
        <JsonRecordTransformDeclaration
          target={props.target}
          type={props.type}
          serializerKind={serializerKind}
        />
      );
    }

    return (
      <JsonModelTransformDeclaration
        type={props.type}
        target={props.target}
        serializerKind={serializerKind}
      />
    );
  }

  if ($.union.is(props.type)) {
    return (
      <JsonUnionTransformDeclaration
        target={props.target}
        type={props.type}
        serializerKind={serializerKind}
      />
    );
  }
}

function getTransformReference(
  type: Type,
  target: "transport" | "application",
  serializerKind: SerializerTransformKind = "json",
): Refkey | undefined {
  const { $ } = useTsp();
  if (type.kind === "Model" && Boolean(type.name)) {
    if ($.array.is(type)) {
      return getArrayTransformRefkey(type, target, serializerKind);
    }

    if ($.record.is(type)) {
      return getRecordTransformRefkey(type, target, serializerKind);
    }
    return getModelTransformRefkey(type, target, serializerKind);
  }

  if (type.kind === "Union" && Boolean(type.name)) {
    return getUnionTransformRefkey(type, target, serializerKind);
  }

  return undefined;
}

// Re-export for existing imports
export {
  getArrayTransformRefkey as getJsonArrayTransformRefkey,
  getModelTransformRefkey as getJsonModelTransformRefkey,
  getRecordTransformRefkey as getJsonRecordTransformRefkey,
  getUnionTransformRefkey as getJsonUnionTransformRefkey,
} from "../../../utils/serializer-transform.js";
