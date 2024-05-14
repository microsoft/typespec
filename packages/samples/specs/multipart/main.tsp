import "@typespec/rest";

using TypeSpec.Http;

model Data {
  id: HttpPart<string>;
  profileImage: HttpPart<bytes>;
  photos: HttpPart<bytes>[];
  address: HttpPart<Address>;
}

model Address {
  city: string;
  street: string;
}

op basic(@header contentType: "multipart/form-data", @multipartBody body: Data): string;
