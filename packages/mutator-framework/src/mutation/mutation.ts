import type { MemberType, Type } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationHalfEdge,
  MutationOptions,
  MutationTraits,
} from "./mutation-engine.js";

export interface MutationInfo extends Record<string, unknown> {
  mutationKey: string;
  isSynthetic?: boolean;
}

export abstract class Mutation<
  TSourceType extends Type,
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions = MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> {
  abstract readonly kind: string;

  static readonly subgraphNames: string[] = [];

  protected engine: TEngine;
  sourceType: TSourceType;
  protected options: TOptions;
  isMutated: boolean = false;
  protected referenceTypes: MemberType[];
  protected mutationInfo: MutationInfo;

  constructor(
    engine: TEngine,
    sourceType: TSourceType,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    this.engine = engine;
    this.sourceType = sourceType;
    this.options = options;
    this.referenceTypes = referenceTypes;
    this.mutationInfo = info;
  }

  get mutationEngine(): TEngine {
    return this.engine;
  }

  static mutationInfo(
    engine: MutationEngine<any>,
    sourceType: Type,
    referenceTypes: MemberType[],
    options: MutationOptions,
    halfEdge?: MutationHalfEdge,
    traits?: MutationTraits,
  ): MutationInfo | Mutation<any, any, any, any> {
    return {
      mutationKey: options.mutationKey,
      isSynthetic: traits?.isSynthetic,
    };
  }
  abstract mutate(): void;
}
