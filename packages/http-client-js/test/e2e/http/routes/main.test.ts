import { assert, describe, it } from "vitest";
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
} from "../../generated/routes/src/index.js";

describe("Routes", () => {
  const routesClient = new RoutesClient();
  const pathParametersClient = new PathParametersClient();
  const queryParametersClient = new QueryParametersClient();

  describe("fixed", () => {
    it("should call fixed operation at the root level", async () => {
      await routesClient.fixed();
    });
  });

  describe("InInterface", () => {
    const inInterfaceClient = new InInterfaceClient();

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
      const reservedExpansionClient = new ReservedExpansionClient();

      it("should handle reserved expansion with template", async () => {
        await reservedExpansionClient.template("foo/bar baz");
      });

      it("should handle reserved expansion with annotation", async () => {
        await reservedExpansionClient.annotation("foo/bar baz");
      });
    });

    describe("SimpleExpansion", () => {
      describe("Standard", () => {
        const simpleStandardClient = new SimpleStandardClient();

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
        const simpleExplodeClient = new SimpleExplodeClient();

        it.skip("should handle primitive value with explode: true", async () => {
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
        const pathStandardClient = new PathStandardClient();

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
        const pathExplodeClient = new PathExplodeClient();

        it.skip("should handle primitive value with explode: true", async () => {
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
        const labelStandardClient = new LabelStandardClient();

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
        const labelExplodeClient = new LabelExplodeClient();

        it.skip("should handle primitive value with explode: true", async () => {
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
        const matrixStandardClient = new MatrixStandardClient();

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
        const matrixExplodeClient = new MatrixExplodeClient();

        it.skip("should handle primitive value with explode: true", async () => {
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
        const queryStandardClient = new QueryStandardClient();

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
        const queryExplodeClient = new QueryExplodeClient();

        it.skip("should handle primitive value with explode: true", async () => {
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
        const continuationStandardClient = new ContinuationStandardClient();

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
        const continuationExplodeClient = new ContinuationExplodeClient();

        it.skip("should handle primitive value with explode: true", async () => {
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

  describe("Rest Cases", () => {
    let client = new RoutesClient({
      allowInsecureConnection: true,
      endpoint: "http://localhost:3000"
    });;


    it("Routes_InInterface", async () => {
      await client.inInterfaceClient.fixed();
    });

    it("Routes_fixed", async () => {
      await client.fixed();
    });

    it("Routes_PathParameters_templateOnly", async () => {
      await client.pathParametersClient.templateOnly("a");
    });

    it("Routes_PathParameters_explicit", async () => {
      await client.pathParametersClient.explicit("a");
    });
    it("Routes_PathParameters_annotationOnly", async () => {
      await client.pathParametersClient.annotationOnly("a");
    });
    it("Routes_PathParameters_ReservedExpansion_template", async () => {
      await client.pathParametersClient.reservedExpansionClient.template("foo/bar baz");
    });
    it("Routes_PathParameters_ReservedExpansion_annotation", async () => {
      await client.pathParametersClient.reservedExpansionClient.annotation("foo/bar baz");
    });
    it("Routes_PathParameters_SimpleExpansion_Standard_primitive", async () => {
      await client.pathParametersClient.simpleExpansionClient.standardClient.primitive("a");
    });
    it("Routes_PathParameters_SimpleExpansion_Standard_array", async () => {
      await client.pathParametersClient.simpleExpansionClient.standardClient.array(["a", "b"]);
    });
    it("Routes_PathParameters_SimpleExpansion_Standard_record", async () => {
      await client.pathParametersClient.simpleExpansionClient.standardClient.record({ a: 1, b: 2 });
    });
    it("Routes_PathParameters_PathExpansion_Standard_primitive", async () => {
      await client.pathParametersClient.pathExpansionClient.standardClient.primitive("a");
    });

    it("Routes_PathParameters_PathExpansion_Standard_array", async () => {
      await client.pathParametersClient.pathExpansionClient.standardClient.array(["a", "b"]);
    });

    it("Routes_PathParameters_PathExpansion_Standard_record", async () => {
      await client.pathParametersClient.pathExpansionClient.standardClient.record({ a: 1, b: 2 });
    });
    it("Routes_PathParameters_LabelExpansion_Standard_primitive", async () => {
      await client.pathParametersClient.labelExpansionClient.standardClient.primitive("a");
    });

    it("Routes_PathParameters_LabelExpansion_Standard_array", async () => {
      await client.pathParametersClient.labelExpansionClient.standardClient.array(["a", "b"]);
    });
    it("Routes_PathParameters_LabelExpansion_Standard_record", async () => {
      await client.pathParametersClient.labelExpansionClient.standardClient.record({ a: 1, b: 2 });
    });
    it("Routes_PathParameters_SimpleExpansion_Explode_primitive", async () => {
      await client.pathParametersClient.simpleExpansionClient.explodeClient.primitive("a");
    });
    it("Routes_PathParameters_SimpleExpansion_Explode_array", async () => {
      await client.pathParametersClient.simpleExpansionClient.explodeClient.array(["a", "b"]);
    });
    it("Routes_PathParameters_SimpleExpansion_Explode_record", async () => {
      await client.pathParametersClient.simpleExpansionClient.explodeClient.record({ a: 1, b: 2 });
    });
    it("Routes_PathParameters_PathExpansion_Explode_primitive", async () => {
      await client.pathParametersClient.pathExpansionClient.explodeClient.primitive("a");
    });
    it("Routes_PathParameters_PathExpansion_Explode_array", async () => {
      await client.pathParametersClient.pathExpansionClient.explodeClient.array(["a", "b"]);
    });
    it("Routes_PathParameters_PathExpansion_Explode_record", async () => {
      await client.pathParametersClient.pathExpansionClient.explodeClient.record({ a: 1, b: 2 });
    });
    it("Routes_PathParameters_LabelExpansion_Explode_primitive", async () => {
      await client.pathParametersClient.labelExpansionClient.explodeClient.primitive("a");
    });
    it("Routes_PathParameters_LabelExpansion_Explode_array", async () => {
      await client.pathParametersClient.labelExpansionClient.explodeClient.array(["a", "b"]);
    });
    it("Routes_PathParameters_LabelExpansion_Explode_record", async () => {
      await client.pathParametersClient.labelExpansionClient.explodeClient.record({ a: 1, b: 2 });
    });
    it("Routes_PathParameters_MatrixExpansion_Standard_primitive", async () => {
      await client.pathParametersClient.matrixExpansionClient.standardClient.primitive("a");
    });
    it("Routes_PathParameters_MatrixExpansion_Standard_array", async () => {
      await client.pathParametersClient.matrixExpansionClient.standardClient.array(["a", "b"]);
    });
    it("Routes_PathParameters_MatrixExpansion_Standard_record", async () => {
      await client.pathParametersClient.matrixExpansionClient.standardClient.record({ a: 1, b: 2 });
    });
    it("Routes_PathParameters_MatrixExpansion_Explode_primitive", async () => {
      await client.pathParametersClient.matrixExpansionClient.explodeClient.primitive("a");
    });
    it("Routes_PathParameters_MatrixExpansion_Explode_array", async () => {
      await client.pathParametersClient.matrixExpansionClient.explodeClient.array(["a", "b"]);
    });
    it("Routes_PathParameters_MatrixExpansion_Explode_record", async () => {
      await client.pathParametersClient.matrixExpansionClient.explodeClient.record({ a: 1, b: 2 });
    });

    it("Routes_QueryParameters_templateOnly", async () => {
      await client.queryParametersClient.templateOnly("a");
    });
    it("Routes_QueryParameters_explicit", async () => {
      await client.queryParametersClient.explicit("a");
    });
    it("Routes_QueryParameters_annotationOnly", async () => {
      await client.queryParametersClient.annotationOnly("a");
    });
    it("Routes_QueryParameters_QueryExpansion_Standard_primitive", async () => {
      await client.queryParametersClient.queryExpansionClient.standardClient.primitive("a");
    });
    it("Routes_QueryParameters_QueryExpansion_Standard_array", async () => {
      await client.queryParametersClient.queryExpansionClient.standardClient.array(["a", "b"]);
    });
    it("Routes_QueryParameters_QueryExpansion_Standard_record", async () => {
      await client.queryParametersClient.queryExpansionClient.standardClient.record({ a: 1, b: 2 });
    });
    it("Routes_QueryParameters_QueryExpansion_Explode_primitive", async () => {
      await client.queryParametersClient.queryExpansionClient.explodeClient.primitive("a");
    });
    it("Routes_QueryParameters_QueryExpansion_Explode_array", async () => {
      await client.queryParametersClient.queryExpansionClient.explodeClient.array(["a", "b"]);
    });
    it("Routes_QueryParameters_QueryExpansion_Explode_record", async () => {
      await client.queryParametersClient.queryExpansionClient.explodeClient.record({ a: 1, b: 2 });
    });
    it("Routes_QueryParameters_QueryContinuation_Standard_primitive", async () => {
      await client.queryParametersClient.queryContinuationClient.standardClient.primitive("a");
    });
    it("Routes_QueryParameters_QueryContinuation_Standard_array", async () => {
      await client.queryParametersClient.queryContinuationClient.standardClient.array(["a", "b"]);
    });
    it("Routes_QueryParameters_QueryContinuation_Standard_record", async () => {
      await client.queryParametersClient.queryContinuationClient.standardClient.record({
        a: 1,
        b: 2
      });
    });
    it("Routes_QueryParameters_QueryContinuation_Explode_primitive", async () => {
      await client.queryParametersClient.queryContinuationClient.explodeClient.primitive("a");
    });
    it("Routes_QueryParameters_QueryContinuation_Explode_array", async () => {
      await client.queryParametersClient.queryContinuationClient.explodeClient.array(["a", "b"]);
    });
    it("Routes_QueryParameters_QueryContinuation_Explode_record", async () => {
      await client.queryParametersClient.queryContinuationClient.explodeClient.record({
        a: 1,
        b: 2
      });
    });

  });
});
