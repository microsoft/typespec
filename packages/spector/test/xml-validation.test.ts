import {
  createMatcher,
  err,
  match,
  ok,
  validateXmlBodyEquals,
  xml,
  type RequestExt,
  type ResolverConfig,
} from "@typespec/spec-api";
import { describe, expect, it } from "vitest";

const config: ResolverConfig = { baseUrl: "http://localhost:3000" };

function makeRequest(rawBody: string): RequestExt {
  return { rawBody } as unknown as RequestExt;
}

describe("validateXmlBodyEquals", () => {
  describe("with plain string (no matchers)", () => {
    it("should accept matching XML", () => {
      expect(() =>
        validateXmlBodyEquals(
          makeRequest(`<?xml version='1.0' encoding='UTF-8'?><Root><a>1</a></Root>`),
          "<Root><a>1</a></Root>",
        ),
      ).not.toThrow();
    });

    it("should reject mismatched XML", () => {
      expect(() =>
        validateXmlBodyEquals(
          makeRequest(`<?xml version='1.0' encoding='UTF-8'?><Root><a>2</a></Root>`),
          "<Root><a>1</a></Root>",
        ),
      ).toThrow("Body provided doesn't match expected body");
    });

    it("should reject empty body", () => {
      expect(() => validateXmlBodyEquals(makeRequest(""), "<Root/>")).toThrow("Body should exists");
    });
  });

  describe("with Resolver containing matchers", () => {
    it("should use matcher check instead of strict equality", () => {
      // A custom matcher that accepts any number
      const anyNumber = createMatcher<string>({
        check(actual) {
          return typeof actual === "string" && /^\d+$/.test(actual)
            ? ok()
            : err("expected a number string");
        },
        serialize: () => "PLACEHOLDER",
      });

      const body = xml`<Root><val>${anyNumber}</val></Root>`;

      // "42" is a number string → should pass
      expect(() =>
        validateXmlBodyEquals(
          makeRequest(`<?xml version='1.0' encoding='UTF-8'?><Root><val>42</val></Root>`),
          body.rawContent as any,
          config,
        ),
      ).not.toThrow();

      // "abc" is not a number → should fail
      expect(() =>
        validateXmlBodyEquals(
          makeRequest(`<?xml version='1.0' encoding='UTF-8'?><Root><val>abc</val></Root>`),
          body.rawContent as any,
          config,
        ),
      ).toThrow("Body provided doesn't match expected body");
    });

    it("should validate plain elements strictly alongside matchers", () => {
      const anyNumber = createMatcher<string>({
        check(actual) {
          return typeof actual === "string" && /^\d+$/.test(actual)
            ? ok()
            : err("expected a number string");
        },
        serialize: () => "0",
      });

      const body = xml`<Item><name>test</name><count>${anyNumber}</count></Item>`;

      // Both correct
      expect(() =>
        validateXmlBodyEquals(
          makeRequest(
            `<?xml version='1.0' encoding='UTF-8'?><Item><name>test</name><count>5</count></Item>`,
          ),
          body.rawContent as any,
          config,
        ),
      ).not.toThrow();

      // Plain element wrong
      expect(() =>
        validateXmlBodyEquals(
          makeRequest(
            `<?xml version='1.0' encoding='UTF-8'?><Item><name>wrong</name><count>5</count></Item>`,
          ),
          body.rawContent as any,
          config,
        ),
      ).toThrow("Body provided doesn't match expected body");
    });

    it("should work with datetime matchers", () => {
      const body = xml`<Event><when>${match.dateTime.rfc3339("2022-08-26T18:38:00.000Z")}</when></Event>`;

      // Without fractional seconds — same point in time
      expect(() =>
        validateXmlBodyEquals(
          makeRequest(
            `<?xml version='1.0' encoding='UTF-8'?><Event><when>2022-08-26T18:38:00Z</when></Event>`,
          ),
          body.rawContent as any,
          config,
        ),
      ).not.toThrow();

      // Different time
      expect(() =>
        validateXmlBodyEquals(
          makeRequest(
            `<?xml version='1.0' encoding='UTF-8'?><Event><when>2023-01-01T00:00:00Z</when></Event>`,
          ),
          body.rawContent as any,
          config,
        ),
      ).toThrow("Body provided doesn't match expected body");
    });

    it("should work with multiple matchers", () => {
      const body = xml`<Model><a>${match.dateTime.utcRfc3339("2022-08-26T18:38:00.000Z")}</a><b>${match.dateTime.rfc7231("Fri, 26 Aug 2022 14:38:00 GMT")}</b></Model>`;

      expect(() =>
        validateXmlBodyEquals(
          makeRequest(
            `<?xml version='1.0' encoding='UTF-8'?><Model><a>2022-08-26T18:38:00.0000000Z</a><b>Fri, 26 Aug 2022 14:38:00 GMT</b></Model>`,
          ),
          body.rawContent as any,
          config,
        ),
      ).not.toThrow();
    });
  });
});
