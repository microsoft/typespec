import { Entity, ModelProperty, Operation, Type } from "../../core/types.js";
import { getPagingOperation, PagingOperation } from "../../lib/paging.js";
import { createDiagnosable, Diagnosable } from "../create-diagnosable.js";
import { defineKit } from "../define-kit.js";

/**
 * A descriptor for an operation.
 */
export interface OperationDescriptor {
  /**
   * The name of the model property.
   */
  name: string;

  /**
   * The parameters to the model
   */
  parameters: ModelProperty[];

  /**
   * The return type of the model
   */
  returnType: Type;
}

/**
 * Utilities for working with operation properties.
 * @typekit operation
 */
export interface OperationKit {
  /**
   * Create an operation type.
   *
   * @param desc The descriptor of the operation.
   */
  create(desc: OperationDescriptor): Operation;
  /**
   * Check if the type is an operation.
   * @param type type to check
   */
  is(type: Entity): type is Operation;
  /**
   * Get the paging operation's metadata for an operation.
   * @param operation operation to get the paging operation for
   */
  getPagingMetadata: Diagnosable<(operation: Operation) => PagingOperation | undefined>;
}

interface TypekitExtension {
  /**
   * Utilities for working with operation properties.
   */
  operation: OperationKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  operation: {
    is(type) {
      return type.entityKind === "Type" && type.kind === "Operation";
    },
    getPagingMetadata: createDiagnosable(function (operation) {
      return getPagingOperation(this.program, operation);
    }),
    create(desc) {
      const parametersModel = this.model.create({
        name: `${desc.name}Parameters`,
        properties: desc.parameters.reduce(
          (acc, property) => {
            acc[property.name] = property;
            return acc;
          },
          {} as Record<string, ModelProperty>,
        ),
      });
      const operation: Operation = this.program.checker.createType({
        kind: "Operation",
        name: desc.name,
        decorators: [],
        parameters: parametersModel,
        returnType: desc.returnType,
      });
      this.program.checker.finishType(operation);
      return operation;
    },
  },
});
