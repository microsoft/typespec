import { parse } from "uri-template";
import {
  FileAttachmentMultipartRequest,
  TodoAttachment,
  TodoAttachmentPage,
} from "../../../models/models.js";
import {
  fileAttachmentMultipartRequestToTransport,
  todoAttachmentPageToApplication,
  todoAttachmentToTransport,
} from "../../../models/serializers.js";
import { AttachmentsClientContext } from "./clientContext.js";

export async function list(
  client: AttachmentsClientContext,
  itemId: number,
): Promise<TodoAttachmentPage> {
  const path = parse("/items/{itemId}/attachments").expand({
    itemId: itemId,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200) {
    return todoAttachmentPageToApplication(response.body);
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
    body: fileAttachmentMultipartRequestToTransport(body),
  };

  const response = await client.path(path).post(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
