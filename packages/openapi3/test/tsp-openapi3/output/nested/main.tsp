import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "Nested sample" })
@info(#{ version: "0.0.0" })
namespace Nestedsample;

namespace SubA {
  model Thing {
    id: int64;
  }
  namespace SubSubA {
    model Thing {
      name: string;
    }
    @route("/sub/a/subsub") @post op doSomething(@body body: SubA.SubSubA.Thing): Body<string>;
  }
}

namespace SubB {
  model Thing {
    id: int64;
  }
  @route("/sub/b") @post op doSomething(@body body: SubB.Thing): Body<string>;
}

namespace SubC {
  @route("/") @post op anotherOp(
    @body body: {
      thing: SubA.Thing;
      thing2: SubA.Thing;
    },
  ): Body<string>;
}
