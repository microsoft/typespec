import { Output, render } from "@alloy-js/core";
import { createCSharpNamePolicy } from "@alloy-js/csharp";
import { describe, expect, it } from "vitest";
import { Base64UrlJsonConverter } from "./base64-url-json-converter.jsx";
import { HttpServiceExceptionFilter } from "./http-service-exception-filter.jsx";
import { JsonConverters } from "./json-converters.jsx";
import { JsonSerializationProvider } from "./json-serialization-provider.jsx";
import { TimeSpanDurationConverter } from "./time-span-duration-converter.jsx";
import { UnixEpochDateTimeConverter } from "./unix-epoch-date-time-converter.jsx";

function findFileContent(output: any, pathSuffix: string): string | undefined {
  function search(dir: any): string | undefined {
    for (const item of dir.contents) {
      if (
        "contents" in item &&
        typeof item.contents === "string" &&
        (item.path.endsWith("/" + pathSuffix) || item.path === pathSuffix)
      ) {
        return item.contents;
      }
      if ("contents" in item && Array.isArray(item.contents)) {
        const found = search(item);
        if (found) return found;
      }
    }
    return undefined;
  }
  return search(output);
}

describe("TimeSpanDurationConverter", () => {
  it("renders converter with XmlConvert usage", () => {
    const output = render(
      <Output namePolicy={createCSharpNamePolicy()}>
        <TimeSpanDurationConverter />
      </Output>,
    );
    const content = findFileContent(output, "TimeSpanDurationConverter.cs");
    expect(content).toBeDefined();
    expect(content).toContain("class TimeSpanDurationConverter");
    expect(content).toContain("XmlConvert.ToTimeSpan");
  });
});

describe("Base64UrlJsonConverter", () => {
  it("renders converter with base64url encoding logic", () => {
    const output = render(
      <Output namePolicy={createCSharpNamePolicy()}>
        <Base64UrlJsonConverter />
      </Output>,
    );
    const content = findFileContent(output, "Base64UrlJsonConverter.cs");
    expect(content).toBeDefined();
    expect(content).toContain("class Base64UrlJsonConverter");
    expect(content).toContain("Convert.FromBase64String");
  });
});

describe("UnixEpochDateTimeConverter", () => {
  it("renders converter with Unix epoch logic", () => {
    const output = render(
      <Output namePolicy={createCSharpNamePolicy()}>
        <UnixEpochDateTimeConverter />
      </Output>,
    );
    const dateTimeContent = findFileContent(output, "UnixEpochDateTimeConverter.cs");
    expect(dateTimeContent).toBeDefined();
    expect(dateTimeContent).toContain("class UnixEpochDateTimeConverter");
    expect(dateTimeContent).toContain("AddMilliseconds");

    const offsetContent = findFileContent(output, "UnixEpochDateTimeOffsetConverter.cs");
    expect(offsetContent).toBeDefined();
    expect(offsetContent).toContain("class UnixEpochDateTimeOffsetConverter");
    expect(offsetContent).toContain("AddMilliseconds");
  });
});

describe("HttpServiceExceptionFilter", () => {
  it("renders exception filter and exception class", () => {
    const output = render(
      <Output namePolicy={createCSharpNamePolicy()}>
        <HttpServiceExceptionFilter />
      </Output>,
    );
    const content = findFileContent(output, "HttpServiceException.cs");
    expect(content).toBeDefined();
    expect(content).toContain("class HttpServiceExceptionFilter");
    expect(content).toContain("IActionFilter, IOrderedFilter");
    expect(content).toContain("class HttpServiceException");
  });
});

describe("JsonSerializationProvider", () => {
  it("renders provider with all converters registered", () => {
    const output = render(
      <Output namePolicy={createCSharpNamePolicy()}>
        <JsonSerializationProvider />
      </Output>,
    );
    const content = findFileContent(output, "JsonSerializationProvider.cs");
    expect(content).toBeDefined();
    expect(content).toContain("class JsonSerializationProvider");
    expect(content).toContain("IJsonSerializationProvider");
    expect(content).toContain("virtual JsonSerializerOptions Options");
    expect(content).toContain("virtual T? Deserialize");
    expect(content).toContain("virtual string Serialize");

    const ifaceContent = findFileContent(output, "IJsonSerializationProvider.cs");
    expect(ifaceContent).toBeDefined();
    expect(ifaceContent).toContain("interface IJsonSerializationProvider");
  });
});

describe("JsonConverters", () => {
  it("renders all converter files in lib directory", () => {
    const output = render(
      <Output namePolicy={createCSharpNamePolicy()}>
        <JsonConverters />
      </Output>,
    );
    expect(findFileContent(output, "TimeSpanDurationConverter.cs")).toBeDefined();
    expect(findFileContent(output, "Base64UrlJsonConverter.cs")).toBeDefined();
    expect(findFileContent(output, "UnixEpochDateTimeConverter.cs")).toBeDefined();
    expect(findFileContent(output, "UnixEpochDateTimeOffsetConverter.cs")).toBeDefined();
    expect(findFileContent(output, "HttpServiceException.cs")).toBeDefined();
    expect(findFileContent(output, "JsonSerializationProvider.cs")).toBeDefined();
    expect(findFileContent(output, "IJsonSerializationProvider.cs")).toBeDefined();
  });
});
