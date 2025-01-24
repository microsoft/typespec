import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { createHttpClientJavascriptEmitterTestRunner } from "../../test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createHttpClientJavascriptEmitterTestRunner();
});

describe("HttpResponse", () => {
  it("should handle a basic response", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;
    
    model FileWithHttpPartSpecificContentTypeRequest {
      profileImage: HttpPart<FileSpecificContentType>;
    }


    @post op create(
      @header contentType: "multipart/form-data"
      @multipartBody: FileWithHttpPartSpecificContentTypeRequest): NoContentResponse;
    `;
  });
});
