import { parse } from "uri-template";
import { ToyResponsePage } from "../../models/models.js";
import { toyResponsePageToApplication } from "../../models/serializers.js";
import { ListPetToysResponseClientContext } from "./clientContext.js";

export async function list(
  client: ListPetToysResponseClientContext,
  nameFilter: string,
  petId: string,
): Promise<ToyResponsePage> {
  const path = parse("/pets/{petId}/toys{?nameFilter}").expand({
    petId: petId,
    nameFilter: nameFilter,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200) {
    return toyResponsePageToApplication(response.body);
  }

  throw new Error("Unhandled response");
}
