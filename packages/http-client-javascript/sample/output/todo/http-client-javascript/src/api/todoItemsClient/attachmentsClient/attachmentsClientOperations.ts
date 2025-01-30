import { parse } from "uri-template";
import { FileAttachmentMultipartRequest, Page, TodoAttachment } from "../../../models/models.js";
import {
  createFileAttachmentPayloadToTransport,
  pageToApplication,
  todoAttachmentToTransport,
} from "../../../models/serializers.js";
import { AttachmentsClientContext } from "./attachmentsClientContext.js";

export async function list(client: AttachmentsClientContext, itemId: number): Promise<Page> {
  const path = parse("/items/{itemId}/attachments").expand({
    itemId: itemId,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return pageToApplication(response.body);
  }

  throw new Error("Unhandled response");
}
export async function createJsonAttachment(
  client: AttachmentsClientContext,
  itemId: number,
  contents: TodoAttachment,
): Promise<void> {
  const path = parse("/items/{itemId}/attachments").expand({
    itemId: itemId,
  });

  const httpRequestOptions = {
    headers: {
      "content-type": "application/json",
    },
    body: todoAttachmentToTransport(contents),
  };

  const response = await client.path(path).post(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
export async function createFileAttachment(
  client: AttachmentsClientContext,
  itemId: number,
  body: FileAttachmentMultipartRequest,
): Promise<void> {
  const path = parse("/items/{itemId}/attachments").expand({
    itemId: itemId,
  });

  const httpRequestOptions = {
    headers: {
      "content-type": "multipart/form-data",
    },
    body: createFileAttachmentPayloadToTransport(body),
  };

  const response = await client.path(path).post(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
