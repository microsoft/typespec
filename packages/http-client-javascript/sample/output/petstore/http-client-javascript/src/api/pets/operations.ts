import { parse } from "uri-template";
import { Pet, PetResponsePage } from "../../models/models.js";
import {
  petResponsePageToApplication,
  petToApplication,
  petToTransport,
} from "../../models/serializers.js";
import { httpFetch } from "../../utilities/http-fetch.js";
import { PetStoreContext } from "../clientContext.js";

export async function delete_(client: PetStoreContext, petId: number): Promise<void> {
  const path = parse("/pets/{petId}").expand({
    petId: petId,
  });

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "delete",
    headers: {},
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 200 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}

export async function list(
  client: PetStoreContext,
  options?: {
    nextLink?: string;
  },
): Promise<PetResponsePage> {
  const path = parse("/pets{?nextLink}").expand({
    nextLink: options?.nextLink,
  });

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "get",
    headers: {},
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 200) {
    const bodyJson = await response.json();
    return petResponsePageToApplication(bodyJson);
  }

  throw new Error("Unhandled response");
}

export async function read(client: PetStoreContext, petId: number): Promise<Pet | Pet> {
  const path = parse("/pets/{petId}").expand({
    petId: petId,
  });

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "get",
    headers: {},
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 200) {
    const bodyJson = await response.json();
    return petToApplication(bodyJson);
  }

  if (response.status === 304) {
    const bodyJson = await response.json();
    return {
      name: bodyJson.name,
      tag: bodyJson.tag,
      age: bodyJson.age,
    };
  }

  throw new Error("Unhandled response");
}

export async function create(client: PetStoreContext, pet: Pet): Promise<Pet> {
  const path = parse("/pets").expand({});

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(petToTransport(pet)),
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 200) {
    const bodyJson = await response.json();
    return petToApplication(bodyJson);
  }

  throw new Error("Unhandled response");
}
