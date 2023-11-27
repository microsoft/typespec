import "@typespec/rest";

using TypeSpec.Http;

model Data {
  id: string;
  profileImage: bytes;
  address: Address;
}

model Address {
  city: string;
  street: string;
}

op basic(@header contentType: "multipart/form-data", @body body: Data): string;
