import "@typespec/rest";

using Http;

@service(#{ title: "Nested sample" })
namespace Root {
  @route("/sub/a")
  namespace SubA {
    model Thing {
      id: int64;
    }

    @route("subsub")
    namespace SubSubA {
      @post op doSomething(@body thing: Thing): OkResponse & Body<string>;

      // Doesn't conflict with parent namespace!
      model Thing {
        name: string;
      }
    }
  }

  @route("/sub/b")
  namespace SubB {
    // Uses the same name as
    model Thing {
      id: int64;
    }

    @post op doSomething(@body thing: Thing): string;
  }

  namespace SubC {
    @post op anotherOp(thing: Root.SubA.Thing, thing2: SubA.Thing): string;
  }
}
