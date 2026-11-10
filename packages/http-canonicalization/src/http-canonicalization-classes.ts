import type { InstancesFor } from "@typespec/mutator-framework";
import { EnumMemberHttpCanonicalization } from "./enum-member.js";
import { EnumHttpCanonicalization } from "./enum.js";
import { IntrinsicHttpCanonicalization } from "./intrinsic.js";
import { LiteralHttpCanonicalization } from "./literal.js";
import { ModelPropertyHttpCanonicalization } from "./model-property.js";
import { ModelHttpCanonicalization } from "./model.js";
import { OperationHttpCanonicalization } from "./operation.js";
import { ScalarHttpCanonicalization } from "./scalar.js";
import { UnionVariantHttpCanonicalization } from "./union-variant.js";
import { UnionHttpCanonicalization } from "./union.js";

/**
 * Source-kind dispatch table used by {@link HttpCanonicalizer}. Several source
 * kinds share the literal canonicalization; node `kind` need not equal source `kind`.
 */
export const CANONICALIZATION_CLASSES = {
  Operation: OperationHttpCanonicalization,
  Model: ModelHttpCanonicalization,
  ModelProperty: ModelPropertyHttpCanonicalization,
  Scalar: ScalarHttpCanonicalization,
  Union: UnionHttpCanonicalization,
  Intrinsic: IntrinsicHttpCanonicalization,
  UnionVariant: UnionVariantHttpCanonicalization,
  Enum: EnumHttpCanonicalization,
  EnumMember: EnumMemberHttpCanonicalization,
  String: LiteralHttpCanonicalization,
  Number: LiteralHttpCanonicalization,
  Boolean: LiteralHttpCanonicalization,
  StringTemplate: LiteralHttpCanonicalization,
  Tuple: LiteralHttpCanonicalization,
} as const;

/** Instance types keyed by source kind, for the HTTP mutation engine's typed dispatch. */
export type HttpCanonicalizationMutations = InstancesFor<typeof CANONICALIZATION_CLASSES>;

/** Union of registered HTTP canonicalization nodes; narrow by `kind` to navigate shape-specific data. */
export type HttpCanonicalization = InstanceType<
  (typeof CANONICALIZATION_CLASSES)[keyof typeof CANONICALIZATION_CLASSES]
>;
