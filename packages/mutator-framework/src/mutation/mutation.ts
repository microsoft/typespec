import type { MemberType, Type } from "@typespec/compiler";
import type { CustomMutationClasses, MutationEngine, MutationOptions } from "./mutation-engine.js";

export interface MutationInfo extends Record<string, unknown> {
  mutationKey: string;
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

  static mutationInfo(
    engine: MutationEngine<any>,
    sourceType: Type,
    referenceTypes: MemberType[],
    options: MutationOptions,
  ): MutationInfo {
    return {
      mutationKey: options.mutationKey,
    };
  }
  abstract mutate(): void;
}
