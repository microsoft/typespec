import "@typespec/rest";

using Http;

model Jpeg extends File {
  contentType: "image/jpeg";
}

model Data {
  id: HttpPart<string>;
  profileImage: HttpPart<File>;
  photos: HttpPart<Jpeg>[];
  address: HttpPart<Address>;
}

model Address {
  city: string;
  street: string;
}

op basic(@header contentType: "multipart/form-data", @multipartBody body: Data): string;
