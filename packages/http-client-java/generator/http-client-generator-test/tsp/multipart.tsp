import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service({
  title: "Multipart",
})
namespace Cadl.Multipart;

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
  name: string;
  resolution: int32;
  type: ImageType;
  size: Size;
  image: bytes;
  fileData?: bytes[];
}

@route("/upload/images/{name}")
@post
op upload(
  @path name: string,
  @query compress?: boolean,
  @header contentType: "multipart/form-data",
  @body data: FormData,
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
    fileData2: HttpPart<File>;
    size: HttpPart<Size>;
  },
): OkResponse;
