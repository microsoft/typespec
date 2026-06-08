import { isTemplateInstance, type MemberType, type Model } from "@typespec/compiler";
import {
  SimpleModelMutation,
  type MutationInfo,
  type SimpleMutationEngine,
  type SimpleMutationOptions,
  type SimpleMutations,
} from "@typespec/mutator-framework";
import { isInterface } from "../../lib/interface.js";
import { applyTypeNamePipeline } from "../../lib/naming.js";
import { composeTemplateName } from "../../lib/template-composition.js";
import { GraphQLMutationOptions, GraphQLTypeContext } from "../options.js";

/**
 * GraphQL-specific Model mutation.
 */
export class GraphQLModelMutation extends SimpleModelMutation<SimpleMutationOptions> {
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<SimpleMutationOptions>>,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: SimpleMutationOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  /**
   * The input/output context this model was mutated with, if any.
   * Undefined when the model was mutated directly (not through an operation).
   */
  get typeContext(): GraphQLTypeContext | undefined {
    return this.options instanceof GraphQLMutationOptions ? this.options.typeContext : undefined;
  }

  mutate() {
    const program = this.engine.$.program;
    const isInputContext = this.typeContext === GraphQLTypeContext.Input;
    const isInterfaceModel = isInterface(program, this.sourceType);
    const rawName = isTemplateInstance(this.sourceType)
      ? composeTemplateName(this.sourceType)
      : this.sourceType.name;

    this.mutationNode.mutate((model) => {
      model.name = applyTypeNamePipeline(rawName, {
        isInput: isInputContext,
        isInterface: isInterfaceModel,
      });
    });
    super.mutate();
  }
}
