import { parse } from "uri-template";
import { AttachmentPage, TodoAttachment } from "../../models/models.js";
import { attachmentPageToApplication } from "../../models/serializers.js";
import { AttachmentsClientContext } from "./clientContext.js";

export async function list(
  client: AttachmentsClientContext,
  itemId: number,
): Promise<AttachmentPage | void> {
  const path = parse("/items/{itemId}/attachments").expand({
    itemId: itemId,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200) {
    return attachmentPageToApplication(response.body);
  }

  if (+response.status === 404 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
export async function createAttachment(
  client: AttachmentsClientContext,
  itemId: number,
  contents: TodoAttachment,
): Promise<void> {
  const path = parse("/items/{itemId}/attachments").expand({
    itemId: itemId,
  });

  const httpRequestOptions = {
    headers: {
      "Content-Type": "application/json",
    },
    body: contents,
  };

  const response = await client.path(path).post(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  if (+response.status === 404 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
