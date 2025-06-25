import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service(#{ title: "Multipart" })
namespace TspTest.Multipart;

union ImageType {
  string,
  "JPEG",
  "PNG",
}

model Size {
  width: int32;
  height: int32;
}

model FormData {
  name: HttpPart<string>;
  resolution: HttpPart<int32>;
  type: HttpPart<ImageType>;
  size: HttpPart<Size>;
  image: HttpPart<bytes>;
  fileData?: HttpPart<bytes>[];
}

@route("/upload/images/{name}")
@post
op upload(
  @path name: string,
  @query compress?: boolean,
  @header contentType: "multipart/form-data",
  @multipartBody data: FormData,
): OkResponse;

model Inherit1File extends File {
  contentType?: string;
  filename: string;
}

/**
 * Image file of content-type "image/jpeg"
 */
@clientName("InheritFileData")
model Inherit2File extends Inherit1File {
  contentType: "image/jpeg";
}

@route("/uploadHttpPart/images/{name}")
@post
op uploadHttpPart(
  @path name: string,
  @query compress?: boolean,
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    fileData1: HttpPart<Inherit2File>;
    fileData2: HttpPart<File, #{ name: "file_data2" }>;
    size: HttpPart<Size>;
  },
): OkResponse;
