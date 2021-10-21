import {
  addModelProperty,
  addOperationParameter,
  addOperationResponseType,
} from "@cadl-lang/compiler";
import { $path, $query } from "@cadl-lang/rest";

export function $addProperties(program, model) {
  // Add a property of intrinsic type
  addModelProperty(program, model, "foo", "string");

  // Add a property with a type that hasn't been explicitly referenced in Cadl
  // until now
  addModelProperty(program, model, "other", "OtherModel");
}

export function $addCommonParameters(program, operation) {
  $path(
    program,
    addOperationParameter(program, operation, "subscriptionId", "string", { insertIndex: 0 })
  );
  $query(
    program,
    addOperationParameter(program, operation, "resourceGroup?", "string", { insertIndex: 1 })
  );
}

export function $addResponseTypes(program, operation) {
  addOperationResponseType(program, operation, "OkResponse<string>");
  addOperationResponseType(program, operation, "OtherModel");
}
