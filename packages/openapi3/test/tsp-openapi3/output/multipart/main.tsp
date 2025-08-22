import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "(title)" })
@info(#{ version: "0.0.0" })
namespace title;

model Pet {
  name: string;
  age_in_pet_years?: int32;
}

model PetOwner {
  name?: string;
  pet?: Pet;
}

model PetOwnerProfileRequestBody {
  owner: HttpPart<PetOwner & {
    @header contentType: "application/json";
  }>;
  @extension("x-oaiTypeLabel", "file") file: HttpPart<File<"image/png">>;
  referrer?: HttpPart<string>;
  age: HttpPart<int32>;
}

@route("/") @post op extensive(
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    owner: HttpPart<PetOwner & {
      @header contentType: "application/json";
    }>;

    @extension("x-oaiTypeLabel", "file")
    file: HttpPart<File<"image/png">>;

    referrer?: HttpPart<string>;
    age: HttpPart<int32>;
  },
): NoContentResponse;

@route("/profile") @post op extensive(
  @header contentType: "multipart/form-data",
  @multipartBody body: PetOwnerProfileRequestBody,
): NoContentResponse;
