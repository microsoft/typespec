import { parse } from "uri-template";
import { dateRfc7231Serializer } from "../models/serializers.js";
import { RepeatabilityClientContext } from "./repeatabilityClientContext.js";
import { OperationOptions } from "../helpers/interfaces.js";
import { createRestError } from "../helpers/error.js";

export interface ImmediateSuccessOptions extends OperationOptions {

}export async function immediateSuccess(
  client: RepeatabilityClientContext,
  repeatabilityRequestId: string,
  repeatabilityFirstSent: Date,
  options?: ImmediateSuccessOptions,): Promise<void> {
  const path = parse("/special-headers/repeatability/immediateSuccess").expand({

  });
  const httpRequestOptions = {
    headers: {
      "repeatability-request-id": repeatabilityRequestId,
      "repeatability-first-sent": dateRfc7231Serializer(repeatabilityFirstSent)
    },
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions)

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  ;if (+response.status === 204 && !response.body) {
    return;
  }throw createRestError(response);
};