import { type Children, For, List } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import {
  compilerAssert,
  type Enum,
  type EnumMember,
  type Union,
  type UnionVariant,
} from "@typespec/compiler";
import { useTsp } from "../../core/context/tsp-context.js";
import { efRefkey } from "../utils/refkey.js";
import { TypeExpression } from "./type-expression.jsx";

export interface UnionExpressionProps {
  type: Union | Enum;
  children?: Children;
}

export function UnionExpression({ type, children }: UnionExpressionProps) {
  const { $ } = useTsp();
  const items = ($.union.is(type) ? type.variants : type.members) as Map<
    string,
    UnionVariant | EnumMember
  >;

  const variants = (
    <For joiner={" | "} each={items}>
      {(_, type) => {
        if ($.enumMember.is(type)) {
          return <ts.ValueExpression jsValue={type.value ?? type.name} />;
        }

        const discriminatedUnion = $.union.getDiscriminatedUnion(type.union);
        switch (discriminatedUnion?.options.envelope) {
          case "object":
            return (
              <ObjectEnvelope
                discriminatorPropertyName={discriminatedUnion.options.discriminatorPropertyName}
                envelopePropertyName={discriminatedUnion.options.envelopePropertyName}
                type={type}
              />
            );
          case "none":
            return (
              <NoneEnvelope
                discriminatorPropertyName={discriminatedUnion.options.discriminatorPropertyName}
                type={type}
              />
            );
          default:
            return <TypeExpression type={type.type} />;
        }
      }}
    </For>
  );

  if (children || (Array.isArray(children) && children.length)) {
    return (
      <>
        {variants} {`| ${children}`}
      </>
    );
  }

  return variants;
}

interface ObjectEnvelopeProps {
  type: UnionVariant;
  discriminatorPropertyName: string;
  envelopePropertyName: string;
}

/**
 * Renders a discriminated union with "object" envelope style
 * where model properties are nested inside an envelope
 */
function ObjectEnvelope(props: ObjectEnvelopeProps) {
  const { $ } = useTsp();

  const envelope = $.model.create({
    properties: {
      [props.discriminatorPropertyName]: $.modelProperty.create({
        name: props.discriminatorPropertyName,
        type: $.literal.createString(props.type.name as string),
      }),
      [props.envelopePropertyName]: $.modelProperty.create({
        name: props.envelopePropertyName,
        type: props.type.type,
      }),
    },
  });

  return <TypeExpression type={envelope} />;
}

interface NoneEnvelopeProps {
  type: UnionVariant;
  discriminatorPropertyName: string;
}

/**
 * Renders a discriminated union with "none" envelope style
 * where discriminator property sits alongside model properties
 */
function NoneEnvelope(props: NoneEnvelopeProps) {
  const { $ } = useTsp();

  compilerAssert(
    $.model.is(props.type.type),
    "Expected all union variants to be models when using a discriminated union with no envelope",
  );

  // Render anonymous models as a set of properties + the discriminator
  if ($.model.isExpresion(props.type.type)) {
    const model = $.model.create({
      properties: {
        [props.discriminatorPropertyName]: $.modelProperty.create({
          name: props.discriminatorPropertyName,
          type: $.literal.createString(props.type.name as string),
        }),
        ...Object.fromEntries(props.type.type.properties),
      },
    });
    return <TypeExpression type={model} />;
  }

  return (
    <List joiner={" & "}>
      <ts.ObjectExpression>
        <ts.ObjectProperty
          name={props.discriminatorPropertyName}
          value={<ts.ValueExpression jsValue={props.type.name} />}
        />
      </ts.ObjectExpression>
      <>{efRefkey(props.type.type)}</>
    </List>
  );
}
