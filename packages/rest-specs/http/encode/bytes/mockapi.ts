import { passOnSuccess, mockapi, json, CollectionFormat, MockApi } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";
import { resolvePath } from "@typespec/compiler";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const root = resolvePath(fileURLToPath(import.meta.url), "../../../../../");

const pngFile = readFileSync(resolvePath(root, "assets/image.png"));

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createQueryMockApis(route: string, value: any, collectionFormat?: CollectionFormat): MockApi {
  const url = `/encode/bytes/query/${route}`;
  return mockapi.get(url, (req) => {
    req.expect.containsQueryParam("value", value, collectionFormat);
    return {
      status: 204,
    };
  });
}

function createPropertyMockApis(route: string, value: any): MockApi {
  const url = `/encode/bytes/property/${route}`;
  return mockapi.post(url, (req) => {
    req.expect.coercedBodyEquals({ value: value });
    return {
      status: 200,
      body: json({ value: value }),
    };
  });
}

function createHeaderMockApis(route: string, value: any): MockApi {
  const url = `/encode/bytes/header/${route}`;
  return mockapi.get(url, (req) => {
    req.expect.containsHeader("value", value);
    return {
      status: 204,
    };
  });
}

function createRequestBodyMockApis(route: string, value: any, contentType: string = "application/json"): MockApi {
  const url = `/encode/bytes/body/request/${route}`;
  return mockapi.post(url, (req) => {
    req.expect.containsHeader("content-type", contentType);
    req.expect.rawBodyEquals(value);
    return {
      status: 204,
    };
  });
}

function createResponseBodyMockApis(route: string, value: any, contentType: string = "application/json"): MockApi {
  const url = `/encode/bytes/body/response/${route}`;
  return mockapi.get(url, (req) => {
    return {
      status: 200,
      body: {
        contentType: contentType,
        rawContent: value,
      },
    };
  });
}

Scenarios.Encode_Bytes_Query_default = passOnSuccess(createQueryMockApis("default", "dGVzdA=="));
Scenarios.Encode_Bytes_Query_base64 = passOnSuccess(createQueryMockApis("base64", "dGVzdA=="));
Scenarios.Encode_Bytes_Query_base64url = passOnSuccess(createQueryMockApis("base64url", "dGVzdA"));
Scenarios.Encode_Bytes_Query_base64urlArray = passOnSuccess(
  createQueryMockApis("base64url-array", ["dGVzdA", "dGVzdA"], "csv"),
);

Scenarios.Encode_Bytes_Property_default = passOnSuccess(createPropertyMockApis("default", "dGVzdA=="));
Scenarios.Encode_Bytes_Property_base64 = passOnSuccess(createPropertyMockApis("base64", "dGVzdA=="));
Scenarios.Encode_Bytes_Property_base64url = passOnSuccess(createPropertyMockApis("base64url", "dGVzdA"));
Scenarios.Encode_Bytes_Property_base64urlArray = passOnSuccess(
  createPropertyMockApis("base64url-array", ["dGVzdA", "dGVzdA"]),
);

Scenarios.Encode_Bytes_Header_default = passOnSuccess(createHeaderMockApis("default", "dGVzdA=="));
Scenarios.Encode_Bytes_Header_base64 = passOnSuccess(createHeaderMockApis("base64", "dGVzdA=="));
Scenarios.Encode_Bytes_Header_base64url = passOnSuccess(createHeaderMockApis("base64url", "dGVzdA"));
Scenarios.Encode_Bytes_Header_base64urlArray = passOnSuccess(createHeaderMockApis("base64url-array", "dGVzdA,dGVzdA"));

// Request body
Scenarios.Encode_Bytes_RequestBody_default = passOnSuccess(createRequestBodyMockApis("default", '"dGVzdA=="'));
Scenarios.Encode_Bytes_RequestBody_octetStream = passOnSuccess(
  createRequestBodyMockApis("octet-stream", pngFile, "application/octet-stream"),
);
Scenarios.Encode_Bytes_RequestBody_customContentType = passOnSuccess(
  createRequestBodyMockApis("custom-content-type", pngFile, "image/png"),
);
Scenarios.Encode_Bytes_RequestBody_base64 = passOnSuccess(createRequestBodyMockApis("base64", '"dGVzdA=="'));
Scenarios.Encode_Bytes_RequestBody_base64url = passOnSuccess(createRequestBodyMockApis("base64url", '"dGVzdA"'));

// Response body
Scenarios.Encode_Bytes_ResponseBody_default = passOnSuccess(createResponseBodyMockApis("default", '"dGVzdA=="'));
Scenarios.Encode_Bytes_ResponseBody_octetStream = passOnSuccess(
  createResponseBodyMockApis("octet-stream", pngFile, "application/octet-stream"),
);
Scenarios.Encode_Bytes_ResponseBody_customContentType = passOnSuccess(
  createResponseBodyMockApis("custom-content-type", pngFile, "image/png"),
);
Scenarios.Encode_Bytes_ResponseBody_base64 = passOnSuccess(createResponseBodyMockApis("base64", '"dGVzdA=="'));
Scenarios.Encode_Bytes_ResponseBody_base64url = passOnSuccess(createResponseBodyMockApis("base64url", '"dGVzdA"'));

function createQueryServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {
          config: {
            params: data,
          },
        },
        response: {
          status: 204,
        },
      },
    ],
  });
}
Scenarios.Encode_Bytes_Query_Default_Server_Test = createQueryServerTests("/encode/bytes/query/default", {
  value: "dGVzdA==",
});
Scenarios.Encode_Bytes_Query_Base64_Server_Test = createQueryServerTests("/encode/bytes/query/base64", {
  value: "dGVzdA==",
});
Scenarios.Encode_Bytes_Query_Base64_URL = createQueryServerTests("/encode/bytes/query/base64url", {
  value: "dGVzdA",
});
Scenarios.Encode_Bytes_Query_Base64_URL_Array = createQueryServerTests("/encode/bytes/query/base64url-array", {
  value: ["dGVzdA", "dGVzdA"].join(","),
});
function createPropertyServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "post",
        request: {
          body: data,
        },
        response: {
          status: 200,
        },
      },
    ],
  });
}
Scenarios.Encode_Bytes_Property_Default_Server_Test = createPropertyServerTests("/encode/bytes/property/default", {
  value: "dGVzdA==",
});
Scenarios.Encode_Bytes_Property_Base64_Server_Test = createPropertyServerTests("/encode/bytes/property/base64", {
  value: "dGVzdA==",
});
Scenarios.Encode_Bytes_Property_Base64_URL = createPropertyServerTests("/encode/bytes/property/base64url", {
  value: "dGVzdA",
});
Scenarios.Encode_Bytes_Property_Base64_URL_Array = createPropertyServerTests("/encode/bytes/property/base64url-array", {
  value: ["dGVzdA", "dGVzdA"],
});
function createHeaderServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {
          config: {
            headers: data,
          },
        },
        response: {
          status: 204,
        },
      },
    ],
  });
}
Scenarios.Encode_Bytes_Header_Default_Server_Test = createHeaderServerTests("/encode/bytes/header/default", {
  value: "dGVzdA==",
});
Scenarios.Encode_Bytes_Header_Base64_Server_Test = createHeaderServerTests("/encode/bytes/header/base64", {
  value: "dGVzdA==",
});
Scenarios.Encode_Bytes_Header_Base64_URL = createHeaderServerTests("/encode/bytes/header/base64url", {
  value: "dGVzdA",
});
Scenarios.Encode_Bytes_Header_Base64_URL_Array = createHeaderServerTests("/encode/bytes/header/base64url-array", {
  value: ["dGVzdA", "dGVzdA"].join(","),
});
function createRequestBodyServerTests(uri: string, data: any, headersData: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "post",
        request: {
          body: data,
          config: {
            headers: headersData,
          },
        },
        response: {
          status: 204,
        },
      },
    ],
  });
}
Scenarios.Encode_Bytes_Body_Request_Default_Server_Test = createRequestBodyServerTests(
  "/encode/bytes/body/request/default",
  "dGVzdA==",
  {
    "Content-Type": "application/json",
  },
);
Scenarios.Encode_Bytes_Body_Request_Base64 = createRequestBodyServerTests(
  "/encode/bytes/body/request/base64",
  "dGVzdA==",
  {
    "Content-Type": "application/json",
  },
);
Scenarios.Encode_Bytes_Body_Request_Base64_URL = createRequestBodyServerTests(
  "/encode/bytes/body/request/base64url",
  "dGVzdA",
  {
    "Content-Type": "application/json",
  },
);
Scenarios.Encode_Bytes_Body_Request_Custom_Content_Type = createRequestBodyServerTests(
  "/encode/bytes/body/request/custom-content-type",
  "image.png",
  {
    "Content-Type": "image/png",
  },
);
Scenarios.Encode_Bytes_Body_Request_Octet_Stream = createRequestBodyServerTests(
  "/encode/bytes/body/request/octet-stream",
  "image.png",
  {
    "Content-Type": "application/octet-stream",
  },
);
function createResponseBodyServerTests(uri: string, data: any, headerData: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {
          config: {
            headers: headerData,
          },
        },
        response: {
          status: 200,
          data: data,
        },
      },
    ],
  });
}
Scenarios.Encode_Bytes_Body_Response_Default = createResponseBodyServerTests(
  "/encode/bytes/body/response/default",
  "dGVzdA==",
  {
    "Content-Type": "application/json",
  },
);
Scenarios.Encode_Bytes_Body_Response_Base64 = createResponseBodyServerTests(
  "/encode/bytes/body/response/base64",
  "dGVzdA==",
  {
    "Content-Type": "application/json",
  },
);
Scenarios.Encode_Bytes_Body_Response_Base64_URL = createResponseBodyServerTests(
  "/encode/bytes/body/response/base64url",
  "dGVzdA",
  {
    "Content-Type": "application/json",
  },
);
Scenarios.Encode_Bytes_Body_Response_Custom_Content_Type = createResponseBodyServerTests(
  "/encode/bytes/body/response/custom-content-type",
  'uint8ArrayToString(response.data, "utf-8"), readFileSync(`${__dirname}/image.png`).toString()',
  {
    "Content-Type": "image/png",
  },
);
Scenarios.Encode_Bytes_Body_Response_Octet_Stream = createResponseBodyServerTests(
  "/encode/bytes/body/response/octet-stream",
  'uint8ArrayToString(response.data, "utf-8"), readFileSync(`${__dirname}/image.png`).toString()',
  {
    "Content-Type": "application/octet-stream",
  },
);
