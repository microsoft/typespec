import {
  match,
  MockRequest,
  xml,
  type MockBody,
  type RequestExt,
  type ResolverConfig,
} from "@typespec/spec-api";
import { describe, expect, it } from "vitest";

const config: ResolverConfig = { baseUrl: "http://localhost:3000" };

function makeRequestExt(rawBody: string): RequestExt {
  return {
    rawBody,
    protocol: "http",
    get: () => "localhost:3000",
    headers: {},
    query: {},
    params: {},
  } as unknown as RequestExt;
}

/**
 * Simulate how spector validates XML (replicates the logic in app.ts validateBody).
 */
function validateXmlBody(body: MockBody, rawBody: string) {
  const req = new MockRequest(makeRequestExt(rawBody));

  if (typeof body.rawContent === "string") {
    const xmlStr = body.rawContent.replace(`<?xml version='1.0' encoding='UTF-8'?>`, "");
    req.expect.xmlBodyEquals(xmlStr);
  } else if (body.rawContent) {
    req.expect.xmlBodyEquals(body.rawContent as any, config);
  }
}

describe("XML validation with matchers", () => {
  describe("datetime matchers", () => {
    const body = xml`
<ModelWithDatetime>
  <rfc3339>${match.dateTime.utcRfc3339("2022-08-26T18:38:00.000Z")}</rfc3339>
  <rfc7231>${match.dateTime.rfc7231("Fri, 26 Aug 2022 14:38:00 GMT")}</rfc7231>
</ModelWithDatetime>`;

    it("should accept exact match", () => {
      expect(() =>
        validateXmlBody(
          body,
          `<?xml version='1.0' encoding='UTF-8'?><ModelWithDatetime><rfc3339>2022-08-26T18:38:00.000Z</rfc3339><rfc7231>Fri, 26 Aug 2022 14:38:00 GMT</rfc7231></ModelWithDatetime>`,
        ),
      ).not.toThrow();
    });

    it("should accept datetime without fractional seconds", () => {
      expect(() =>
        validateXmlBody(
          body,
          `<?xml version='1.0' encoding='UTF-8'?><ModelWithDatetime><rfc3339>2022-08-26T18:38:00Z</rfc3339><rfc7231>Fri, 26 Aug 2022 14:38:00 GMT</rfc7231></ModelWithDatetime>`,
        ),
      ).not.toThrow();
    });

    it("should accept datetime with extra precision", () => {
      expect(() =>
        validateXmlBody(
          body,
          `<?xml version='1.0' encoding='UTF-8'?><ModelWithDatetime><rfc3339>2022-08-26T18:38:00.0000000Z</rfc3339><rfc7231>Fri, 26 Aug 2022 14:38:00 GMT</rfc7231></ModelWithDatetime>`,
        ),
      ).not.toThrow();
    });

    it("should reject wrong time", () => {
      expect(() =>
        validateXmlBody(
          body,
          `<?xml version='1.0' encoding='UTF-8'?><ModelWithDatetime><rfc3339>2022-08-26T19:00:00.000Z</rfc3339><rfc7231>Fri, 26 Aug 2022 14:38:00 GMT</rfc7231></ModelWithDatetime>`,
        ),
      ).toThrow("Body provided doesn't match expected body");
    });

    it("should reject timezone offset for utcRfc3339", () => {
      expect(() =>
        validateXmlBody(
          body,
          `<?xml version='1.0' encoding='UTF-8'?><ModelWithDatetime><rfc3339>2022-08-26T18:38:00.000+00:00</rfc3339><rfc7231>Fri, 26 Aug 2022 14:38:00 GMT</rfc7231></ModelWithDatetime>`,
        ),
      ).toThrow("Body provided doesn't match expected body");
    });

    it("should reject wrong rfc7231 value", () => {
      expect(() =>
        validateXmlBody(
          body,
          `<?xml version='1.0' encoding='UTF-8'?><ModelWithDatetime><rfc3339>2022-08-26T18:38:00.000Z</rfc3339><rfc7231>Mon, 01 Jan 2024 00:00:00 GMT</rfc7231></ModelWithDatetime>`,
        ),
      ).toThrow("Body provided doesn't match expected body");
    });

    it("should reject non-date string", () => {
      expect(() =>
        validateXmlBody(
          body,
          `<?xml version='1.0' encoding='UTF-8'?><ModelWithDatetime><rfc3339>not-a-date</rfc3339><rfc7231>Fri, 26 Aug 2022 14:38:00 GMT</rfc7231></ModelWithDatetime>`,
        ),
      ).toThrow("Body provided doesn't match expected body");
    });

    it("should reject empty body", () => {
      expect(() => validateXmlBody(body, "")).toThrow("Body should exists");
    });
  });

  describe("plain values alongside matchers", () => {
    const body = xml`
<Item>
  <name>test</name>
  <created>${match.dateTime.rfc3339("2022-08-26T18:38:00.000Z")}</created>
</Item>`;

    it("should pass when plain values and matcher values are correct", () => {
      expect(() =>
        validateXmlBody(
          body,
          `<?xml version='1.0' encoding='UTF-8'?><Item><name>test</name><created>2022-08-26T18:38:00Z</created></Item>`,
        ),
      ).not.toThrow();
    });

    it("should reject when plain value differs", () => {
      expect(() =>
        validateXmlBody(
          body,
          `<?xml version='1.0' encoding='UTF-8'?><Item><name>wrong</name><created>2022-08-26T18:38:00Z</created></Item>`,
        ),
      ).toThrow("Body provided doesn't match expected body");
    });

    it("should reject when matcher value differs", () => {
      expect(() =>
        validateXmlBody(
          body,
          `<?xml version='1.0' encoding='UTF-8'?><Item><name>test</name><created>2023-01-01T00:00:00Z</created></Item>`,
        ),
      ).toThrow("Body provided doesn't match expected body");
    });
  });

  describe("plain XML without matchers", () => {
    const body = xml("<Root><value>hello</value></Root>");

    it("should accept exact match", () => {
      expect(() =>
        validateXmlBody(
          body,
          `<?xml version='1.0' encoding='UTF-8'?><Root><value>hello</value></Root>`,
        ),
      ).not.toThrow();
    });

    it("should reject different value", () => {
      expect(() =>
        validateXmlBody(
          body,
          `<?xml version='1.0' encoding='UTF-8'?><Root><value>world</value></Root>`,
        ),
      ).toThrow("Body provided doesn't match expected body");
    });

    it("should use strict comparison for plain xml (no datetime flexibility)", () => {
      const plainBody = xml("<Root><date>2022-08-26T18:38:00.000Z</date></Root>");
      expect(() =>
        validateXmlBody(
          plainBody,
          `<?xml version='1.0' encoding='UTF-8'?><Root><date>2022-08-26T18:38:00Z</date></Root>`,
        ),
      ).toThrow("Body provided doesn't match expected body");
    });
  });
});
