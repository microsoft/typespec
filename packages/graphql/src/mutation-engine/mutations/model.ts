import {
  isTemplateInstance,
  walkPropertiesInherited,
  type MemberType,
  type Model,
} from "@typespec/compiler";
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
import { isRecordType } from "../../lib/type-utils.js";
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
    const tk = this.engine.$;
    const program = tk.program;
    const isInputContext = this.typeContext === GraphQLTypeContext.Input;

    if (isRecordType(this.sourceType) && walkPropertiesInherited(this.sourceType).next().done) {
      const rawName = isTemplateInstance(this.sourceType)
        ? composeTemplateName(this.sourceType)
        : this.sourceType.name;
      const scalarName = applyTypeNamePipeline(rawName, {
        isInput: isInputContext,
        isInterface: false,
      });
      const scalar = program.checker.createType({
        kind: "Scalar",
        name: scalarName,
        decorators: [],
        derivedScalars: [],
        constructors: new Map(),
      });
      this.mutationNode.replace(scalar);
      return;
    }

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
