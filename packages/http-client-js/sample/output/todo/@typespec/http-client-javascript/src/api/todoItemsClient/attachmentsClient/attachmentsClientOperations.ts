import { parse } from "uri-template";
import { OperationOptions } from "../../../helpers/interfaces.js";
import { createFilePartDescriptor } from "../../../helpers/multipart-helpers.js";
import { FileAttachmentMultipartRequest, Page, TodoAttachment } from "../../../models/models.js";
import {
  jsonPageToApplicationTransform,
  jsonTodoAttachmentToTransportTransform,
} from "../../../models/serializers.js";
import { AttachmentsClientContext } from "./attachmentsClientContext.js";

export interface ListOptions extends OperationOptions {}
export async function list(
  client: AttachmentsClientContext,
  itemId: number,
  options?: ListOptions,
): Promise<Page> {
  const path = parse("/items/{itemId}/attachments").expand({
    itemId: itemId,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonPageToApplicationTransform(response.body)!;
  }

  throw new Error("Unhandled response");
}
export interface CreateJsonAttachmentOptions extends OperationOptions {
  contentType?: "application/json";
}
export async function createJsonAttachment(
  client: AttachmentsClientContext,
  itemId: number,
  contents: TodoAttachment,
  options?: CreateJsonAttachmentOptions,
): Promise<void> {
  const path = parse("/items/{itemId}/attachments").expand({
    itemId: itemId,
  });

  const httpRequestOptions = {
    headers: {
      contentType: options?.contentType ?? "application/json",
    },
    body: jsonTodoAttachmentToTransportTransform(contents),
  };

  const response = await client.path(path).post(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
export interface CreateFileAttachmentOptions extends OperationOptions {
  contentType?: "multipart/form-data";
}
export async function createFileAttachment(
  client: AttachmentsClientContext,
  itemId: number,
  body: FileAttachmentMultipartRequest,
  options?: CreateFileAttachmentOptions,
): Promise<void> {
  const path = parse("/items/{itemId}/attachments").expand({
    itemId: itemId,
  });

  const httpRequestOptions = {
    headers: {
      contentType: options?.contentType ?? "multipart/form-data",
    },
    body: [createFilePartDescriptor("contents", body.contents)],
  };

  const response = await client.path(path).post(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
