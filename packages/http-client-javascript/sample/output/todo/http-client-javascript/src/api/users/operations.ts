import { parse } from "uri-template";
import { User } from "../../models/models.js";
import { userToTransport } from "../../models/serializers.js";
import { httpFetch } from "../../utilities/http-fetch.js";
import { TodoContext } from "../clientContext.js";

export async function create(
  client: TodoContext,
  user: User,
): Promise<{
  id: number;
  username: string;
  email: string;
  token: string;
}> {
  const path = parse("/users").expand({});

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userToTransport(user)),
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 200) {
    const bodyJson = await response.json();
    return {
      id: bodyJson.id,
      username: bodyJson.username,
      email: bodyJson.email,
      token: bodyJson.token,
    };
  }

  throw new Error("Unhandled response");
}
