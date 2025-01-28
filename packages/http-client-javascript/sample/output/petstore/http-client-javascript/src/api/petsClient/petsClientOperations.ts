import { parse } from "uri-template";
import { Pet, ResponsePage } from "../../models/models.js";
import {
  petToApplication,
  petToTransport,
  responsePageToApplication,
} from "../../models/serializers.js";
import { PetsClientContext } from "./petsClientContext.js";

export async function delete_(client: PetsClientContext, petId: number): Promise<void> {
  const path = parse("/pets/{petId}").expand({
    petId: petId,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).delete(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
export async function list(
  client: PetsClientContext,
  options?: {
    nextLink?: string;
  },
): Promise<ResponsePage> {
  const path = parse("/pets{?nextLink}").expand({
    nextLink: options?.nextLink,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200) {
    return responsePageToApplication(response.body);
  }

  throw new Error("Unhandled response");
}
export async function read(client: PetsClientContext, petId: number): Promise<Pet> {
  const path = parse("/pets/{petId}").expand({
    petId: petId,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200) {
    return petToApplication(response.body);
  }

  if (+response.status === 200) {
    return petToApplication(response.body);
  }

  throw new Error("Unhandled response");
}
export async function create(client: PetsClientContext, pet: Pet): Promise<Pet> {
  const path = parse("/pets").expand({});

  const httpRequestOptions = {
    headers: {
      "content-type": "application/json",
    },
    body: petToTransport(pet),
  };

  const response = await client.path(path).post(httpRequestOptions);
  if (+response.status === 200) {
    return petToApplication(response.body);
  }

  throw new Error("Unhandled response");
}
