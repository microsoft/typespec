import { getEncode, ModelProperty, Scalar, Type } from "@typespec/compiler";
import { Encoder, getJsScalar } from "../common/scalar.js";
import { JsContext, Module } from "../ctx.js";

/**
 * A resolved encoding chain for a model property or scalar.
 */
export interface ResolvedEncodingChain {
  /**
   * The canonical type of the property -- a.k.a. the logical type that the service implementor will use.
   */
  canonicalType: Type;
  /**
   * The ultimate encoding target. This will always be the same as the `.type` of the last encoder in the chain, or
   * the same as the canonical type if there are no encoders.
   */
  targetType: Type;
  /**
   * The chain of encoders tht apply to the canonical type. These are applied in order front-to-back to encode the
   * canonical type into the target type, and are applied back-to-front to decode the canonical type from the target type.
   */
  encoders: Encoder[];
}

const ENCODE_SOURCES: { [k in "ModelProperty" | "Scalar"]: (t: ModelProperty | Scalar) => Type } = {
  ModelProperty: (t) => (t as ModelProperty).type,
  Scalar: (t) => t,
};

/**
 * Resolves the chain of `@encode` encoders that apply to a given property with a given canonical (logical) type.
 *
 * @param ctx - The context to use for resolving encoders.
 * @param module - The module that the property is defined in.
 * @param encodeSource - The original property to resolve encoders for.
 * @param canonicalType - The canonical type of the property -- this might be different from the type of the property itself.
 * @returns A resolved encoding chain describing the final canonical type, the ultimate target type of the chain, and the encoders that apply to the property in order.
 */
export function resolveEncodingChain(
  ctx: JsContext,
  module: Module,
  encodeSource: ModelProperty | Scalar,
  canonicalType: Type,
): ResolvedEncodingChain {
  let encoders: Encoder[] = [];
  let targetType: Type = canonicalType;

  for (const [kind, select] of Object.entries(ENCODE_SOURCES)) {
    while (encodeSource.kind === kind) {
      const s = select(encodeSource);
      const encoding = getEncode(ctx.program, encodeSource);

      if (!encoding) break;

      targetType = encodeSource = encoding.type;

      if (s.kind !== "Scalar") {
        // Decay because we don't know how to encode anything other than a scalar.
        // Should be unreachable?
        decay(encoding.type);
      } else {
        const sourceJsScalar = getJsScalar(ctx, module, s, encodeSource);

        const encoder = sourceJsScalar.getEncoding(encoding);

        if (encoder) {
          encoders.push(encoder);
        } else {
          // Decay because we don't know what the encoding is.
          // Invalidate the entire chain and set the current encoding.type as the canonical type.
          decay(encoding.type);
        }
      }
    }
  }

  return {
    canonicalType,
    targetType,
    encoders,
  };

  function decay(t: ModelProperty | Scalar) {
    encoders = [];
    canonicalType = encodeSource = t;
  }
}
