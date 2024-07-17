import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service({
  title: "Nested sample",
})
@info({
  version: "0.0.0",
})
namespace Nestedsample;

namespace SubA {
  model Thing {
    id: int64;
  }
  namespace SubSubA {
    model Thing {
      name: string;
    }
    /**
     * The request has succeeded.
     */
    model doSomething200ApplicationJsonResponse {
      @statusCode statusCode: 200;
      @bodyRoot body: string;
    }
    @route("/sub/a/subsub") @post op doSomething(
      @bodyRoot body: SubA.SubSubA.Thing,
    ): doSomething200ApplicationJsonResponse;
  }
}

namespace SubB {
  model Thing {
    id: int64;
  }
  /**
   * The request has succeeded.
   */
  model doSomething200ApplicationJsonResponse {
    @statusCode statusCode: 200;
    @bodyRoot body: string;
  }
  @route("/sub/b") @post op doSomething(
    @bodyRoot body: SubB.Thing,
  ): doSomething200ApplicationJsonResponse;
}

namespace SubC {
  /**
   * The request has succeeded.
   */
  model anotherOp200ApplicationJsonResponse {
    @statusCode statusCode: 200;
    @bodyRoot body: string;
  }
  @route("/") @post op anotherOp(
    @bodyRoot body: {
      thing: SubA.Thing;
      thing2: SubA.Thing;
    },
  ): anotherOp200ApplicationJsonResponse;
}
