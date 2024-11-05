import { ModelProperty, Operation, Type } from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";
import { Client } from "../../interfaces.js";
import { AccessKit, getAccess, getName, NameKit } from "./utils.js";

export interface SdkOperationKit extends NameKit<Operation>, AccessKit<Operation> {
  /**
   * Get parameters. This will take into account any parameters listed on the client
   */
  getParameters(client: Client, operation: Operation): ModelProperty[];

  /**
   * Get valid return types for an operation
   */
  getValidReturnType(operation: Operation): Type | undefined;

  /**
   * Get exception response type for an operation
   */
  getExceptionReturnType(operation: Operation): Type | undefined;
}

interface SdkKit {
  operation: SdkOperationKit;
}

declare module "@typespec/compiler/typekit" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface OperationKit extends SdkOperationKit {}
}

defineKit<SdkKit>({
  operation: {
    getAccess(operation) {
      return getAccess(operation);
    },
    getName(operation) {
      return getName(operation);
    },
    getParameters(client, operation) {
      const clientParams = [...$.client.getInitializationModel(client).properties.values()];
      return [...operation.parameters.properties.values()].filter(
        (p) => !clientParams.find((cp) => cp.name === p.name),
      );
    },
    getValidReturnType(operation) {
      const returnType = operation.returnType;
      if (returnType === undefined) {
        return undefined;
      }
      if ($.union.is(returnType)) {
        const validTypes = [...returnType.variants.values()].filter((v) => !$.type.isError(v.type));
        if (validTypes.length === 0) {
          return undefined;
        }
        if (validTypes.length === 1) {
          return validTypes[0].type;
        }
        return $.union.create({ name: "ValidReturnTypes", variants: validTypes });
      }
      if (!$.type.isError(returnType)) {
        return returnType;
      }
      return undefined;
    },
    getExceptionReturnType(operation) {
      const returnType = operation.returnType;
      if (returnType === undefined) {
        return undefined;
      }
      if ($.union.is(returnType)) {
        const errorTypes = [...returnType.variants.values()].filter((v) => $.type.isError(v.type));
        if (errorTypes.length === 0) {
          return undefined;
        }
        if (errorTypes.length === 1) {
          return errorTypes[0].type;
        }
        return $.union.create({ name: "ErrorReturnTypes", variants: errorTypes });
      }
      if ($.type.isError(returnType)) {
        return returnType;
      }
      return undefined;
    },
  },
});
