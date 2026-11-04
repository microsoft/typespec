import { refkey, type Refkey } from "@alloy-js/core";
import type { Model, Type, Union } from "@typespec/compiler";
import { isNullType } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import type { HttpPayloadBody } from "@typespec/http";
import type { ClientOperation } from "@typespec/http-client";
import { unpackProperty } from "../components/utils/unpack-model-property.js";
import {
  FORM_URL_ENCODED_MEDIA_TYPE,
  isFormUrlEncodedContentType,
} from "./form-urlencoded.js";

export type SerializerTransformKind = "json" | "form_urlencoded";

export function getSerializerTransformKind(mediaType?: string): SerializerTransformKind {
  return isFormUrlEncodedContentType(mediaType) ? "form_urlencoded" : "json";
}

export function getSerializerTransformRefkeySuffix(kind: SerializerTransformKind): string {
  return kind === "form_urlencoded" ? "form_urlencoded" : "json";
}

export function getSerializerTransformFunctionPrefix(kind: SerializerTransformKind): string {
  return kind === "form_urlencoded" ? "formUrlEncoded" : "json";
}

export function isFormUrlEncodedPayloadType($: Typekit, type: Type): boolean {
  const payloadType = $.httpPart.unpack(type) ?? type;

  if ($.model.is(payloadType)) {
    return true;
  }

  if ($.union.is(payloadType)) {
    const variants = Array.from(payloadType.variants.values());
    const nullVariant = variants.find((variant) => isNullType(variant.type));
    if (nullVariant && variants.length === 2) {
      const nonNullType = variants.find((variant) => variant !== nullVariant)!.type;
      const nonNullPayload = $.httpPart.unpack(nonNullType) ?? nonNullType;
      return $.model.is(nonNullPayload);
    }
  }

  return false;
}

export function isFormUrlEncodedSingleBody(
  body: HttpPayloadBody | undefined,
  $: Typekit,
): boolean {
  if (!body || body.bodyKind !== "single") {
    return false;
  }

  if (!isFormUrlEncodedContentType(body.contentTypes[0])) {
    return false;
  }

  return isFormUrlEncodedPayloadType($, body.type);
}

function collectNamedTypesForFormSerialization(
  $: Typekit,
  type: Type,
  result: Set<Type>,
  visited: Set<Type>,
): void {
  if (visited.has(type)) {
    return;
  }
  visited.add(type);

  const payloadType = $.httpPart.unpack(type) ?? type;

  if ($.union.is(payloadType)) {
    if (typeof payloadType.name === "string") {
      result.add(payloadType);
    }

    for (const variant of payloadType.variants.values()) {
      if (!isNullType(variant.type)) {
        collectNamedTypesForFormSerialization($, variant.type, result, visited);
      }
    }
    return;
  }

  if ($.model.is(payloadType)) {
    if (typeof payloadType.name === "string") {
      result.add(payloadType);
    }

    for (const property of $.model
      .getProperties(payloadType, { includeExtended: true })
      .values()) {
      collectNamedTypesForFormSerialization($, unpackProperty(property), result, visited);
    }
  }
}

export function getFormUrlEncodedSerializerTypes(
  $: Typekit,
  operations: ClientOperation[],
): Type[] {
  const types = new Set<Type>();
  const visited = new Set<Type>();

  for (const operation of operations) {
    const body = operation.httpOperation.parameters.body;
    if (!isFormUrlEncodedSingleBody(body, $)) {
      continue;
    }

    collectNamedTypesForFormSerialization($, body!.type, types, visited);
  }

  return [...types];
}

export function getModelTransformRefkey(
  type: Model,
  target: "transport" | "application",
  kind: SerializerTransformKind = "json",
): Refkey {
  return refkey(type, `${getSerializerTransformRefkeySuffix(kind)}_model_transform`, target);
}

export function getRecordTransformRefkey(
  type: Model,
  target: "transport" | "application",
  kind: SerializerTransformKind = "json",
): Refkey {
  return refkey(type, `${getSerializerTransformRefkeySuffix(kind)}_record_transform`, target);
}

export function getArrayTransformRefkey(
  type: Model,
  target: "transport" | "application",
  kind: SerializerTransformKind = "json",
): Refkey {
  return refkey(type, `${getSerializerTransformRefkeySuffix(kind)}_array_transform`, target);
}

export function getUnionTransformRefkey(
  type: Union,
  target: "transport" | "application",
  kind: SerializerTransformKind = "json",
): Refkey {
  return refkey(type, `${getSerializerTransformRefkeySuffix(kind)}_union_transform`, target);
}

export { FORM_URL_ENCODED_MEDIA_TYPE };
