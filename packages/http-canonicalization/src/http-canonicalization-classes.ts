import type { InstancesFor } from "@typespec/mutator-framework";
import { IntrinsicHttpCanonicalization } from "./intrinsic.js";
import { LiteralHttpCanonicalization } from "./literal.js";
import { ModelPropertyHttpCanonicalization } from "./model-property.js";
import { ModelHttpCanonicalization } from "./model.js";
import { OperationHttpCanonicalization } from "./operation.js";
import { ScalarHttpCanonicalization } from "./scalar.js";
import { UnionVariantHttpCanonicalization } from "./union-variant.js";
import { UnionHttpCanonicalization } from "./union.js";

export const CANONICALIZATION_CLASSES = {
  Operation: OperationHttpCanonicalization,
  Model: ModelHttpCanonicalization,
  ModelProperty: ModelPropertyHttpCanonicalization,
  Scalar: ScalarHttpCanonicalization,
  Union: UnionHttpCanonicalization,
  Intrinsic: IntrinsicHttpCanonicalization,
  UnionVariant: UnionVariantHttpCanonicalization,
  String: LiteralHttpCanonicalization,
  Number: LiteralHttpCanonicalization,
  Boolean: LiteralHttpCanonicalization,
} as const;

export type HttpCanonicalizationMutations = InstancesFor<typeof CANONICALIZATION_CLASSES>;

export type HttpCanonicalization = InstanceType<
  (typeof CANONICALIZATION_CLASSES)[keyof typeof CANONICALIZATION_CLASSES]
>;
