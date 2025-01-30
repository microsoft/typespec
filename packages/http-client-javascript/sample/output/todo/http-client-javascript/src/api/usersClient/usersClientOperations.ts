import { parse } from "uri-template";
import { User } from "../../models/models.js";
import { userToTransport } from "../../models/serializers.js";
import { UsersClientContext } from "./usersClientContext.js";

export async function create(
  client: UsersClientContext,
  user: User,
): Promise<{
  id: number;
  username: string;
  email: string;
  token: string;
}> {
  const path = parse("/users").expand({});

  const httpRequestOptions = {
    headers: {
      "content-type": "application/json",
    },
    body: userToTransport(user),
  };

  const response = await client.path(path).post(httpRequestOptions);
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return {
      id: response.body.id,
      username: response.body.username,
      email: response.body.email,
      token: response.body.token,
    };
  }

  throw new Error("Unhandled response");
}
