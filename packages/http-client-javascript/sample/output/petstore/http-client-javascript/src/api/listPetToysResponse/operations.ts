import { parse } from "uri-template";
import { ToyResponsePage } from "../../models/models.js";
import { toyResponsePageToApplication } from "../../models/serializers.js";
import { httpFetch } from "../../utilities/http-fetch.js";
import { PetStoreContext } from "../clientContext.js";

export async function list(
  client: PetStoreContext,
  nameFilter: string,
  petId: string,
): Promise<ToyResponsePage> {
  const path = parse("/pets/{petId}/toys{?nameFilter}").expand({
    petId: petId,
    nameFilter: nameFilter,
  });

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "get",
    headers: {},
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 200) {
    const bodyJson = await response.json();
    return toyResponsePageToApplication(bodyJson);
  }

  throw new Error("Unhandled response");
}
