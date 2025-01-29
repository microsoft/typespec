import { describe, it } from "vitest";
import {
  ExplodeClient as ContinuationExplodeClient,
  StandardClient as ContinuationStandardClient,
  InInterfaceClient,
  ExplodeClient as LabelExplodeClient,
  StandardClient as LabelStandardClient,
  ExplodeClient as MatrixExplodeClient,
  StandardClient as MatrixStandardClient,
  ExplodeClient as PathExplodeClient,
  PathParametersClient,
  StandardClient as PathStandardClient,
  ExplodeClient as QueryExplodeClient,
  QueryParametersClient,
  StandardClient as QueryStandardClient,
  ReservedExpansionClient,
  RoutesClient,
  ExplodeClient as SimpleExplodeClient,
  StandardClient as SimpleStandardClient,
} from "../../generated/http/routes/http-client-javascript/src/index.js";

describe("Routes", () => {
  const baseUrl = "http://localhost:3000";

  const routesClient = new RoutesClient(baseUrl);
  const pathParametersClient = new PathParametersClient(baseUrl);
  const queryParametersClient = new QueryParametersClient(baseUrl);

  describe("fixed", () => {
    it("should call fixed operation at the root level", async () => {
      await routesClient.fixed();
    });
  });

  describe("InInterface", () => {
    const inInterfaceClient = new InInterfaceClient(baseUrl);

    it("should call fixed operation inside interface", async () => {
      await inInterfaceClient.fixed();
    });
  });

  describe("PathParameters", () => {
    it("should handle implicit path parameter", async () => {
      await pathParametersClient.templateOnly("a");
    });

    it("should handle explicit @path parameter", async () => {
      await pathParametersClient.explicit("a");
    });

    it("should handle @path parameter without explicit route definition", async () => {
      await pathParametersClient.annotationOnly("a");
    });

    describe("ReservedExpansion", () => {
      const reservedExpansionClient = new ReservedExpansionClient(baseUrl);

      it("should handle reserved expansion with template", async () => {
        await reservedExpansionClient.template("foo/bar baz");
      });

      it("should handle reserved expansion with annotation", async () => {
        await reservedExpansionClient.annotation("foo/bar baz");
      });
    });

    describe("SimpleExpansion", () => {
      describe("Standard", () => {
        const simpleStandardClient = new SimpleStandardClient(baseUrl);

        it("should handle primitive value with explode: false", async () => {
          await simpleStandardClient.primitive("a");
        });

        it("should handle array value with explode: false", async () => {
          await simpleStandardClient.array(["a", "b"]);
        });

        it("should handle record value with explode: false", async () => {
          await simpleStandardClient.record({ a: 1, b: 2 });
        });
      });

      describe("Explode", () => {
        const simpleExplodeClient = new SimpleExplodeClient(baseUrl);

        it("should handle primitive value with explode: true", async () => {
          await simpleExplodeClient.primitive("a");
        });

        it("should handle array value with explode: true", async () => {
          await simpleExplodeClient.array(["a", "b"]);
        });

        it("should handle record value with explode: true", async () => {
          await simpleExplodeClient.record({ a: 1, b: 2 });
        });
      });
    });

    describe("PathExpansion", () => {
      describe("Standard", () => {
        const pathStandardClient = new PathStandardClient(baseUrl);

        it("should handle primitive value with explode: false", async () => {
          await pathStandardClient.primitive("a");
        });

        it("should handle array value with explode: false", async () => {
          await pathStandardClient.array(["a", "b"]);
        });

        it("should handle record value with explode: false", async () => {
          await pathStandardClient.record({ a: 1, b: 2 });
        });
      });

      describe("Explode", () => {
        const pathExplodeClient = new PathExplodeClient(baseUrl);

        it("should handle primitive value with explode: true", async () => {
          await pathExplodeClient.primitive("a");
        });

        it("should handle array value with explode: true", async () => {
          await pathExplodeClient.array(["a", "b"]);
        });

        it("should handle record value with explode: true", async () => {
          await pathExplodeClient.record({ a: 1, b: 2 });
        });
      });
    });

    describe("LabelExpansion", () => {
      describe("Standard", () => {
        const labelStandardClient = new LabelStandardClient(baseUrl);

        it("should handle primitive value with explode: false", async () => {
          await labelStandardClient.primitive("a");
        });

        it("should handle array value with explode: false", async () => {
          await labelStandardClient.array(["a", "b"]);
        });

        it("should handle record value with explode: false", async () => {
          await labelStandardClient.record({ a: 1, b: 2 });
        });
      });

      describe("Explode", () => {
        const labelExplodeClient = new LabelExplodeClient(baseUrl);

        it("should handle primitive value with explode: true", async () => {
          await labelExplodeClient.primitive("a");
        });

        it("should handle array value with explode: true", async () => {
          await labelExplodeClient.array(["a", "b"]);
        });

        it("should handle record value with explode: true", async () => {
          await labelExplodeClient.record({ a: 1, b: 2 });
        });
      });
    });

    describe("MatrixExpansion", () => {
      describe("Standard", () => {
        const matrixStandardClient = new MatrixStandardClient(baseUrl);

        it("should handle primitive value with explode: false", async () => {
          await matrixStandardClient.primitive("a");
        });

        it("should handle array value with explode: false", async () => {
          await matrixStandardClient.array(["a", "b"]);
        });

        it("should handle record value with explode: false", async () => {
          await matrixStandardClient.record({ a: 1, b: 2 });
        });
      });

      describe("Explode", () => {
        const matrixExplodeClient = new MatrixExplodeClient(baseUrl);

        it("should handle primitive value with explode: true", async () => {
          await matrixExplodeClient.primitive("a");
        });

        it("should handle array value with explode: true", async () => {
          await matrixExplodeClient.array(["a", "b"]);
        });

        it("should handle record value with explode: true", async () => {
          await matrixExplodeClient.record({ a: 1, b: 2 });
        });
      });
    });
  });

  describe("QueryParameters", () => {
    it("should handle implicit query parameter", async () => {
      await queryParametersClient.templateOnly("a");
    });

    it("should handle explicit @query parameter", async () => {
      await queryParametersClient.explicit("a");
    });

    it("should handle @query parameter without explicit route definition", async () => {
      await queryParametersClient.annotationOnly("a");
    });

    describe("QueryExpansion", () => {
      describe("Standard", () => {
        const queryStandardClient = new QueryStandardClient(baseUrl);

        it("should handle primitive value with explode: false", async () => {
          await queryStandardClient.primitive("a");
        });

        it("should handle array value with explode: false", async () => {
          await queryStandardClient.array(["a", "b"]);
        });

        it("should handle record value with explode: false", async () => {
          await queryStandardClient.record({ a: 1, b: 2 });
        });
      });

      describe("Explode", () => {
        const queryExplodeClient = new QueryExplodeClient(baseUrl);

        it("should handle primitive value with explode: true", async () => {
          await queryExplodeClient.primitive("a");
        });

        it("should handle array value with explode: true", async () => {
          await queryExplodeClient.array(["a", "b"]);
        });

        it("should handle record value with explode: true", async () => {
          await queryExplodeClient.record({ a: 1, b: 2 });
        });
      });
    });

    describe("QueryContinuation", () => {
      describe("Standard", () => {
        const continuationStandardClient = new ContinuationStandardClient(baseUrl);

        it("should handle primitive value with explode: false", async () => {
          await continuationStandardClient.primitive("a");
        });

        it("should handle array value with explode: false", async () => {
          await continuationStandardClient.array(["a", "b"]);
        });

        it("should handle record value with explode: false", async () => {
          await continuationStandardClient.record({ a: 1, b: 2 });
        });
      });

      describe("Explode", () => {
        const continuationExplodeClient = new ContinuationExplodeClient(baseUrl);

        it("should handle primitive value with explode: true", async () => {
          await continuationExplodeClient.primitive("a");
        });

        it("should handle array value with explode: true", async () => {
          await continuationExplodeClient.array(["a", "b"]);
        });

        it("should handle record value with explode: true", async () => {
          await continuationExplodeClient.record({ a: 1, b: 2 });
        });
      });
    });
  });
});
