import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Define scenario in building the http route/uri
 */
@scenarioService("/routes")
namespace Routes;

@scenario
@scenarioDoc("""
  Simple operation at a fixed in an interface
    Expected path: /routes/fixed
  """)
@route("fixed")
op fixed(): void;

@scenario
@scenarioDoc("""
  Simple operation at a fixed in an interface
    Expected path: /routes/in-interface/fixed
  """)
@route("in-interface")
interface InInterface {
  @route("fixed")
  fixed(): void;
}

@route("path")
namespace PathParameters {
  @scenario
  @scenarioDoc("""
    Path parameter defined implicitly
      Value: "a"
      Expected path: /routes/path/template-only/a
    """)
  @route("template-only/{param}")
  op templateOnly(param: string): void;

  @scenario
  @scenarioDoc("""
    Path parameter defined explicitly
      Value: "a"
      Expected path: /routes/path/explicit/a
    """)
  @route("explicit/{param}")
  op explicit(@path param: string): void;

  @scenario
  @scenarioDoc("""
    Path parameter annotated with @path but not defined explicitly in the route
      Value: "a"
      Expected path: /routes/path/annotation-only/a
    """)
  @route("annotation-only")
  op annotationOnly(@path param: string): void;

  @route("reserved-expansion")
  namespace ReservedExpansion {
    @scenario
    @scenarioDoc("""
      Defines a path parameter that shouldn't encode reserved characters. It should however still encode the other url characters.
        Param value: "foo/bar baz"
        Expected path: "/routes/path/reserved-expansion/template/foo/bar%20baz"
      """)
    @route("template/{+param}")
    op template(param: string): void;

    @scenario
    @scenarioDoc("""
      Defines a path parameter that shouldn't encode reserved characters. It should however still encode the other url characters.
        Param value: "foo/bar baz"
        Expected path: "/routes/path/reserved-expansion/annotation/foo/bar%20baz"
      """)
    @route("annotation")
    op annotation(@path(#{ allowReserved: true }) param: string): void;
  }

  @route("simple")
  namespace SimpleExpansion {
    @route("standard")
    namespace Standard {
      @scenario
      @scenarioDoc("""
        Test simple expansion with explode: false when passed a primitive value.
            Param value: "a"
            Expected path: /routes/path/simple/standard/primitivea
        """)
      @route("primitive{param}")
      op primitive(param: string): void;

      @scenario
      @scenarioDoc("""
        Test simple expansion with explode: false when passed an array value.
            Param value: ["a","b"]
            Expected path: /routes/path/simple/standard/arraya,b
        """)
      @route("array{param}")
      op array(param: string[]): void;

      @scenario
      @scenarioDoc("""
        Test simple expansion with explode: false when passed a record value.
            Param value: {a: 1, b: 2}
            Expected path: /routes/path/simple/standard/recorda,1,b,2
        """)
      @route("record{param}")
      op record(param: Record<int32>): void;
    }

    @route("explode")
    namespace Explode {
      @scenario
      @scenarioDoc("""
        Test simple expansion with explode: true when passed a primitive value.
            Param value: "a"
            Expected path: /routes/path/simple/explode/primitivea
        """)
      @route("primitive{param*}")
      op primitive(param: string): void;

      @scenario
      @scenarioDoc("""
        Test simple expansion with explode: true when passed an array value.
            Param value: ["a","b"]
            Expected path: /routes/path/simple/explode/arraya.b
        """)
      @route("array{param*}")
      op array(param: string[]): void;

      @scenario
      @scenarioDoc("""
        Test simple expansion with explode: true when passed a record value.
            Param value: {a: 1, b: 2}
            Expected path: /routes/path/simple/explode/recorda=1,b=2
        """)
      @route("record{param*}")
      op record(param: Record<int32>): void;
    }
  }

  @route("path")
  namespace PathExpansion {
    @route("standard")
    namespace Standard {
      @scenario
      @scenarioDoc("""
        Test path expansion with explode: false when passed a primitive value.
            Param value: "a"
            Expected path: /routes/path/path/standard/primitive/a
        """)
      @route("primitive{/param}")
      op primitive(param: string): void;

      @scenario
      @scenarioDoc("""
        Test path expansion with explode: false when passed an array value.
            Param value: ["a","b"]
            Expected path: /routes/path/path/standard/array/a,b
        """)
      @route("array{/param}")
      op array(param: string[]): void;

      @scenario
      @scenarioDoc("""
        Test path expansion with explode: false when passed a record value.
            Param value: {a: 1, b: 2}
            Expected path: /routes/path/path/standard/record/a,1,b,2
        """)
      @route("record{/param}")
      op record(param: Record<int32>): void;
    }

    @route("explode")
    namespace Explode {
      @scenario
      @scenarioDoc("""
        Test path expansion with explode: true when passed a primitive value.
            Param value: "a"
            Expected path: /routes/path/path/explode/primitive/a
        """)
      @route("primitive{/param*}")
      op primitive(param: string): void;

      @scenario
      @scenarioDoc("""
        Test path expansion with explode: true when passed an array value.
            Param value: ["a","b"]
            Expected path: /routes/path/path/explode/array/a/b
        """)
      @route("array{/param*}")
      op array(param: string[]): void;

      @scenario
      @scenarioDoc("""
        Test path expansion with explode: true when passed a record value.
            Param value: {a: 1, b: 2}
            Expected path: /routes/path/path/explode/record/a=1/b=2
        """)
      @route("record{/param*}")
      op record(param: Record<int32>): void;
    }
  }

  @route("label")
  namespace LabelExpansion {
    @route("standard")
    namespace Standard {
      @scenario
      @scenarioDoc("""
        Test label expansion with explode: false when passed a primitive value.
            Param value: "a"
            Expected path: /routes/path/label/standard/primitive.a
        """)
      @route("primitive{.param}")
      op primitive(param: string): void;

      @scenario
      @scenarioDoc("""
        Test label expansion with explode: false when passed an array value.
            Param value: ["a","b"]
            Expected path: /routes/path/label/standard/array.a,b
        """)
      @route("array{.param}")
      op array(param: string[]): void;

      @scenario
      @scenarioDoc("""
        Test label expansion with explode: false when passed a record value.
            Param value: {a: 1, b: 2}
            Expected path: /routes/path/label/standard/record.a,1,b,2
        """)
      @route("record{.param}")
      op record(param: Record<int32>): void;
    }

    @route("explode")
    namespace Explode {
      @scenario
      @scenarioDoc("""
        Test label expansion with explode: true when passed a primitive value.
            Param value: "a"
            Expected path: /routes/path/label/explode/primitive.a
        """)
      @route("primitive{.param*}")
      op primitive(param: string): void;

      @scenario
      @scenarioDoc("""
        Test label expansion with explode: true when passed an array value.
            Param value: ["a","b"]
            Expected path: /routes/path/label/explode/array.a.b
        """)
      @route("array{.param*}")
      op array(param: string[]): void;

      @scenario
      @scenarioDoc("""
        Test label expansion with explode: true when passed a record value.
            Param value: {a: 1, b: 2}
            Expected path: /routes/path/label/explode/record.a=1.b=2
        """)
      @route("record{.param*}")
      op record(param: Record<int32>): void;
    }
  }

  @route("matrix")
  namespace MatrixExpansion {
    @route("standard")
    namespace Standard {
      @scenario
      @scenarioDoc("""
        Test matrix expansion with explode: false when passed a primitive value.
            Param value: "a"
            Expected path: /routes/path/matrix/standard/primitive;a
        """)
      @route("primitive{;param}")
      op primitive(param: string): void;

      @scenario
      @scenarioDoc("""
        Test matrix expansion with explode: false when passed an array value.
            Param value: ["a","b"]
            Expected path: /routes/path/matrix/standard/array;a,b
        """)
      @route("array{;param}")
      op array(param: string[]): void;

      @scenario
      @scenarioDoc("""
        Test matrix expansion with explode: false when passed a record value.
            Param value: {a: 1, b: 2}
            Expected path: /routes/path/matrix/standard/record;a,1,b,2
        """)
      @route("record{;param}")
      op record(param: Record<int32>): void;
    }

    @route("explode")
    namespace Explode {
      @scenario
      @scenarioDoc("""
        Test matrix expansion with explode: true when passed a primitive value.
            Param value: "a"
            Expected path: /routes/path/matrix/explode/primitive;a
        """)
      @route("primitive{;param*}")
      op primitive(param: string): void;

      @scenario
      @scenarioDoc("""
        Test matrix expansion with explode: true when passed an array value.
            Param value: ["a","b"]
            Expected path: /routes/path/matrix/explode/array;a.b
        """)
      @route("array{;param*}")
      op array(param: string[]): void;

      @scenario
      @scenarioDoc("""
        Test matrix expansion with explode: true when passed a record value.
            Param value: {a: 1, b: 2}
            Expected path: /routes/path/matrix/explode/record;a=1;b=2
        """)
      @route("record{;param*}")
      op record(param: Record<int32>): void;
    }
  }
}

@route("query")
namespace QueryParameters {
  @scenario
  @scenarioDoc("Query parameter defined implicitly")
  @route("template-only{?param}")
  op templateOnly(param: string): void;

  @scenario
  @scenarioDoc("Query parameter marked with explicit @query")
  @route("explicit{?param}")
  op explicit(@query param: string): void;

  @scenario
  @scenarioDoc("Query parameter annotated with @query but not defined explicitly in the route")
  @route("annotation-only")
  op annotationOnly(@query param: string): void;

  @route("query-expansion")
  namespace QueryExpansion {
    @route("standard")
    namespace Standard {
      @scenario
      @scenarioDoc("""
        Test query expansion with explode: false when passed a primitive value.
            Param value: "a"
            Expected path: /routes/query/query-expansion/standard/primitive?param=a
        """)
      @route("primitive{?param}")
      op primitive(param: string): void;

      @scenario
      @scenarioDoc("""
        Test query expansion with explode: false when passed an array value.
            Param value: ["a","b"]
            Expected path: /routes/query/query-expansion/standard/array?param=a,b
        """)
      @route("array{?param}")
      op array(param: string[]): void;

      @scenario
      @scenarioDoc("""
        Test query expansion with explode: false when passed a record value.
            Param value: {a: 1, b: 2}
            Expected path: /routes/query/query-expansion/standard/record?param=a,1,b,2
        """)
      @route("record{?param}")
      op record(param: Record<int32>): void;
    }

    @route("explode")
    namespace Explode {
      @scenario
      @scenarioDoc("""
        Test query expansion with explode: true when passed a primitive value.
            Param value: "a"
            Expected path: /routes/query/query-expansion/explode/primitive?param=a
        """)
      @route("primitive{?param*}")
      op primitive(param: string): void;

      @scenario
      @scenarioDoc("""
        Test query expansion with explode: true when passed an array value.
            Param value: ["a","b"]
            Expected path: /routes/query/query-expansion/explode/array?param=a&param=b
        """)
      @route("array{?param*}")
      op array(param: string[]): void;

      @scenario
      @scenarioDoc("""
        Test query expansion with explode: true when passed a record value.
            Param value: {a: 1, b: 2}
            Expected path: /routes/query/query-expansion/explode/record?a=1&b=2
        """)
      @route("record{?param*}")
      op record(param: Record<int32>): void;
    }
  }

  @route("query-continuation")
  namespace QueryContinuation {
    @route("standard")
    namespace Standard {
      @scenario
      @scenarioDoc("""
        Test query continuation expansion with explode: false when passed a primitive value.
            Param value: "a"
            Expected path: /routes/query/query-continuation/standard/primitive?fixed=true&param=a
        """)
      @route("primitive?fixed=true{&param}")
      op primitive(param: string): void;

      @scenario
      @scenarioDoc("""
        Test query continuation expansion with explode: false when passed an array value.
            Param value: ["a","b"]
            Expected path: /routes/query/query-continuation/standard/array?fixed=true&param=a,b
        """)
      @route("array?fixed=true{&param}")
      op array(param: string[]): void;

      @scenario
      @scenarioDoc("""
        Test query continuation expansion with explode: false when passed a record value.
            Param value: {a: 1, b: 2}
            Expected path: /routes/query/query-continuation/standard/record?fixed=true&param=a,1,b,2
        """)
      @route("record?fixed=true{&param}")
      op record(param: Record<int32>): void;
    }

    @route("explode")
    namespace Explode {
      @scenario
      @scenarioDoc("""
        Test query continuation expansion with explode: true when passed a primitive value.
            Param value: "a"
            Expected path: /routes/query/query-continuation/explode/primitive?fixed=true&param=a
        """)
      @route("primitive?fixed=true{&param*}")
      op primitive(param: string): void;

      @scenario
      @scenarioDoc("""
        Test query continuation expansion with explode: true when passed an array value.
            Param value: ["a","b"]
            Expected path: /routes/query/query-continuation/explode/array?fixed=true&param=a&param=b
        """)
      @route("array?fixed=true{&param*}")
      op array(param: string[]): void;

      @scenario
      @scenarioDoc("""
        Test query continuation expansion with explode: true when passed a record value.
            Param value: {a: 1, b: 2}
            Expected path: /routes/query/query-continuation/explode/record?fixed=true&a=1&b=2
        """)
      @route("record?fixed=true{&param*}")
      op record(param: Record<int32>): void;
    }
  }
}
