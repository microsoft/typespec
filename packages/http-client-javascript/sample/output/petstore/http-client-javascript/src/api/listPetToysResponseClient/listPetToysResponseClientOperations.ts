import { parse } from "uri-template";
import { ResponsePage_2 } from "../../models/models.js";
import { responsePageToApplication_2 } from "../../models/serializers.js";
import { ListPetToysResponseClientContext } from "./listPetToysResponseClientContext.js";

export async function list(
  client: ListPetToysResponseClientContext,
  nameFilter: string,
  petId: string,
): Promise<ResponsePage_2> {
  const path = parse("/pets/{petId}/toys{?nameFilter}").expand({
    petId: petId,
    nameFilter: nameFilter,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return responsePageToApplication_2(response.body);
  }

  throw new Error("Unhandled response");
}
