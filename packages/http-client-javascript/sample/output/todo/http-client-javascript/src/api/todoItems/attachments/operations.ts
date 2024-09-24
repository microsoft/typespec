import { parse } from "uri-template";
import { TodoAttachment } from "../../../models/models.js";
import { arraySerializer } from "../../../models/serializers.js";
import { httpFetch } from "../../../utilities/http-fetch.js";
import { TodoContext } from "../../clientContext.js";

export async function list(client: TodoContext, itemId: number): Promise<TodoAttachment[] | void> {
  const path = parse("/items/{itemId}/attachments").expand({
    itemId: itemId,
  });

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "get",
    headers: {},
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 200) {
    const bodyJson = await response.json();
    return arraySerializer(bodyJson);
  }

  if (response.status === 404 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}

export async function createAttachment(
  client: TodoContext,
  itemId: number,
  contents: TodoAttachment,
): Promise<void> {
  const path = parse("/items/{itemId}/attachments").expand({
    itemId: itemId,
  });

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contents),
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 204 && !response.body) {
    return;
  }

  if (response.status === 404 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
