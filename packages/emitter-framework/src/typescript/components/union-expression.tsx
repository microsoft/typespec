import * as ay from "@alloy-js/core";
import { Children } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { compilerAssert, Enum, EnumMember, Union, UnionVariant } from "@typespec/compiler";
import { Typekit } from "@typespec/compiler/typekit";
import { useTsp } from "../../core/context/tsp-context.js";
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
    <ay.For joiner={" | "} each={items}>
      {(_, value) => renderVariant($, value)}
    </ay.For>
  );

  // Handle additional children if present
  if (children || (Array.isArray(children) && children.length)) {
    return (
      <>
        {variants} {`| ${children}`}
      </>
    );
  }

  return variants;
}

/**
 * Renders a union variant or enum member based on its type
 */
function renderVariant($: Typekit, value: UnionVariant | EnumMember) {
  if ($.enumMember.is(value)) {
    return <ts.ValueExpression jsValue={value.value ?? value.name} />;
  }

  const discriminatedUnion = $.union.getDiscriminatedUnion(value.union);
  switch (discriminatedUnion?.options.envelope) {
    case "object":
      return (
        <ObjectEnvelope
          discriminatorPropertyName={discriminatedUnion.options.discriminatorPropertyName}
          envelopePropertyName={discriminatedUnion.options.envelopePropertyName}
          type={value}
        />
      );
    case "none":
      return (
        <NoneEnvelope
          discriminatorPropertyName={discriminatedUnion.options.discriminatorPropertyName}
          type={value}
        />
      );
    default:
      // not a discriminated union
      return <TypeExpression type={value.type} />;
  }
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
