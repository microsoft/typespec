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
): Promise<
  | TodoAttachmentPage
  | {
      code: "not-found";
    }
> {
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

  if (+response.status === 200) {
    return {
      code: response.body.code,
    };
  }

  throw new Error("Unhandled response");
}
export async function createJsonAttachment(
  client: AttachmentsClientContext,
  itemId: number,
  contents: TodoAttachment,
): Promise<void | {
  code: "not-found";
}> {
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
    return response.body;
  }

  if (+response.status === 200) {
    return {
      code: response.body.code,
    };
  }

  throw new Error("Unhandled response");
}
export async function createFileAttachment(
  client: AttachmentsClientContext,
  itemId: number,
  body: FileAttachmentMultipartRequest,
): Promise<void | {
  code: "not-found";
}> {
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
    return response.body;
  }

  if (+response.status === 200) {
    return {
      code: response.body.code,
    };
  }

  throw new Error("Unhandled response");
}
