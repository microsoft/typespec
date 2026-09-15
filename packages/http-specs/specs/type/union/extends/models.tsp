using Http;
using Spector;

namespace Type.Union.Extends;

/** UE01: Both alternatives directly inherit the declared base. */
@route("/direct-inheritance")
namespace DirectInheritance {
  union UntaggedUnion extends Named {
    cat: Cat,
    dog: Dog,
  }
  @discriminated(#{ envelope: "none" })
  union InlineUnion extends Named {
    cat: Cat,
    dog: Dog,
  }
  @discriminated
  union EnvelopeUnion extends Named {
    cat: Cat,
    dog: Dog,
  }

  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "cat" | "dog",
        """
          cat: {"name":"Whiskers","meow":true}; dog: {"name":"Rex","bark":false}
          """
      > {}
  @route("/inline")
  interface Inline
    extends GetAndPut<
        InlineUnion,
        "cat" | "dog",
        """
          cat: {"kind":"cat","name":"Whiskers","meow":true}; dog: {"kind":"dog","name":"Rex","bark":false}
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "cat" | "dog",
        """
          cat: {"kind":"cat","value":{"name":"Whiskers","meow":true}}; dog: {"kind":"dog","value":{"name":"Rex","bark":false}}
          """
      > {}
}

/** UE02: Neither alternative inherits the base; "overlap" has no unique shape. */
@route("/structural")
namespace Structural {
  model Quiet {
    name: string;
    volume?: int32;
  }
  model Calm {
    name: string;
    asleep?: boolean;
  }
  union UntaggedUnion extends Named {
    quiet: Quiet,
    calm: Calm,
  }
  @discriminated(#{ envelope: "none" })
  union InlineUnion extends Named {
    quiet: Quiet,
    calm: Calm,
  }
  @discriminated
  union EnvelopeUnion extends Named {
    quiet: Quiet,
    calm: Calm,
  }

  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "quiet" | "calm" | "overlap",
        """
          quiet: {"name":"Quiet","volume":2}; calm: {"name":"Calm","asleep":true}; overlap: {"name":"Both"}
          """
      > {}
  @route("/inline")
  interface Inline
    extends GetAndPut<
        InlineUnion,
        "quiet" | "calm",
        """
          quiet: {"kind":"quiet","name":"Quiet","volume":2}; calm: {"kind":"calm","name":"Calm","asleep":true}
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "quiet" | "calm",
        """
          quiet: {"kind":"quiet","value":{"name":"Quiet","volume":2}}; calm: {"kind":"calm","value":{"name":"Calm","asleep":true}}
          """
      > {}
}

/** UE03: Property composition with spread and model is, not nominal inheritance. */
@route("/spread-and-is")
namespace SpreadAndIs {
  model SpreadCat {
    ...Named;
    meow: boolean;
  }
  model DogShape {
    ...Named;
    bark: boolean;
  }
  model IsDog is DogShape;
  union UntaggedUnion extends Named {
    cat: SpreadCat,
    dog: IsDog,
  }
  @discriminated(#{ envelope: "none" })
  union InlineUnion extends Named {
    cat: SpreadCat,
    dog: IsDog,
  }
  @discriminated
  union EnvelopeUnion extends Named {
    cat: SpreadCat,
    dog: IsDog,
  }

  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "cat" | "dog",
        """
          cat: {"name":"Whiskers","meow":true}; dog: {"name":"Rex","bark":false}
          """
      > {}
  @route("/inline")
  interface Inline
    extends GetAndPut<
        InlineUnion,
        "cat" | "dog",
        """
          cat: {"kind":"cat","name":"Whiskers","meow":true}; dog: {"kind":"dog","name":"Rex","bark":false}
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "cat" | "dog",
        """
          cat: {"kind":"cat","value":{"name":"Whiskers","meow":true}}; dog: {"kind":"dog","value":{"name":"Rex","bark":false}}
          """
      > {}
}

/** UE04: Required intermediate properties and a separate compatible ancestry. */
@route("/ancestry")
namespace Ancestry {
  model Mammal extends Named {
    age: int32;
  }
  model YoungCat extends Mammal {
    meow: boolean;
  }
  model OtherAncestor {
    name: string;
    origin: string;
  }
  model OtherDog extends OtherAncestor {
    bark: boolean;
  }
  union UntaggedUnion extends Named {
    cat: YoungCat,
    dog: OtherDog,
  }
  @discriminated(#{ envelope: "none" })
  union InlineUnion extends Named {
    cat: YoungCat,
    dog: OtherDog,
  }
  @discriminated
  union EnvelopeUnion extends Named {
    cat: YoungCat,
    dog: OtherDog,
  }

  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "cat" | "dog",
        """
          cat: {"name":"Kitten","age":1,"meow":true}; dog: {"name":"Rex","origin":"shelter","bark":false}
          """
      > {}
  @route("/inline")
  interface Inline
    extends GetAndPut<
        InlineUnion,
        "cat" | "dog",
        """
          cat: {"kind":"cat","name":"Kitten","age":1,"meow":true}; dog: {"kind":"dog","name":"Rex","origin":"shelter","bark":false}
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "cat" | "dog",
        """
          cat: {"kind":"cat","value":{"name":"Kitten","age":1,"meow":true}}; dog: {"kind":"dog","value":{"name":"Rex","origin":"shelter","bark":false}}
          """
      > {}
}

/** UE05: Cat is the same model in two unions with the same constraint. */
@route("/shared-same-base")
namespace SharedSameBase {
  @route("/first")
  namespace First {
    union UntaggedUnion extends Named {
      cat: Cat,
      dog: Dog,
    }
    @discriminated(#{ envelope: "none" })
    union InlineUnion extends Named {
      cat: Cat,
      dog: Dog,
    }
    @discriminated
    union EnvelopeUnion extends Named {
      cat: Cat,
      dog: Dog,
    }

    @route("/untagged")
    interface Untagged
      extends GetAndPut<
          UntaggedUnion,
          "cat" | "dog",
          """
            cat: {"name":"Whiskers","meow":true}; dog: {"name":"Rex","bark":false}
            """
        > {}
    @route("/inline")
    interface Inline
      extends GetAndPut<
          InlineUnion,
          "cat" | "dog",
          """
            cat: {"kind":"cat","name":"Whiskers","meow":true}; dog: {"kind":"dog","name":"Rex","bark":false}
            """
        > {}
    @route("/envelope")
    interface Envelope
      extends GetAndPut<
          EnvelopeUnion,
          "cat" | "dog",
          """
            cat: {"kind":"cat","value":{"name":"Whiskers","meow":true}}; dog: {"kind":"dog","value":{"name":"Rex","bark":false}}
            """
        > {}
  }

  @route("/second")
  namespace Second {
    union UntaggedUnion extends Named {
      feline: Cat,
      bird: Bird,
    }
    @discriminated(#{ envelope: "none", discriminatorPropertyName: "petType" })
    union InlineUnion extends Named {
      feline: Cat,
      bird: Bird,
    }
    @discriminated(#{ discriminatorPropertyName: "animal", envelopePropertyName: "data" })
    union EnvelopeUnion extends Named {
      feline: Cat,
      bird: Bird,
    }

    @route("/untagged")
    interface Untagged
      extends GetAndPut<
          UntaggedUnion,
          "feline" | "bird",
          """
            feline: {"name":"Whiskers","meow":true}; bird: {"name":"Sky","wings":2}
            """
        > {}
    @route("/inline")
    interface Inline
      extends GetAndPut<
          InlineUnion,
          "feline" | "bird",
          """
            feline: {"petType":"feline","name":"Whiskers","meow":true}; bird: {"petType":"bird","name":"Sky","wings":2}
            """
        > {}
    @route("/envelope")
    interface Envelope
      extends GetAndPut<
          EnvelopeUnion,
          "feline" | "bird",
          """
            feline: {"animal":"feline","data":{"name":"Whiskers","meow":true}}; bird: {"animal":"bird","data":{"name":"Sky","wings":2}}
            """
        > {}
  }
}

/** UE06: Union membership is not all descendants of the shared named base. */
@route("/disjoint-same-base")
namespace DisjointSameBase {
  @route("/first")
  namespace First {
    union UntaggedUnion extends Named {
      cat: Cat,
      dog: Dog,
    }
    @discriminated(#{ envelope: "none" })
    union InlineUnion extends Named {
      cat: Cat,
      dog: Dog,
    }
    @discriminated
    union EnvelopeUnion extends Named {
      cat: Cat,
      dog: Dog,
    }

    @route("/untagged")
    interface Untagged
      extends GetAndPut<
          UntaggedUnion,
          "cat" | "dog",
          """
            cat: {"name":"Whiskers","meow":true}; dog: {"name":"Rex","bark":false}
            """
        > {}
    @route("/inline")
    interface Inline
      extends GetAndPut<
          InlineUnion,
          "cat" | "dog",
          """
            cat: {"kind":"cat","name":"Whiskers","meow":true}; dog: {"kind":"dog","name":"Rex","bark":false}
            """
        > {}
    @route("/envelope")
    interface Envelope
      extends GetAndPut<
          EnvelopeUnion,
          "cat" | "dog",
          """
            cat: {"kind":"cat","value":{"name":"Whiskers","meow":true}}; dog: {"kind":"dog","value":{"name":"Rex","bark":false}}
            """
        > {}
  }

  @route("/second")
  namespace Second {
    union UntaggedUnion extends Named {
      bird: Bird,
      fish: Fish,
    }
    @discriminated(#{ envelope: "none" })
    union InlineUnion extends Named {
      bird: Bird,
      fish: Fish,
    }
    @discriminated
    union EnvelopeUnion extends Named {
      bird: Bird,
      fish: Fish,
    }

    @route("/untagged")
    interface Untagged
      extends GetAndPut<
          UntaggedUnion,
          "bird" | "fish",
          """
            bird: {"name":"Sky","wings":2}; fish: {"name":"Gold","fins":3}
            """
        > {}
    @route("/inline")
    interface Inline
      extends GetAndPut<
          InlineUnion,
          "bird" | "fish",
          """
            bird: {"kind":"bird","name":"Sky","wings":2}; fish: {"kind":"fish","name":"Gold","fins":3}
            """
        > {}
    @route("/envelope")
    interface Envelope
      extends GetAndPut<
          EnvelopeUnion,
          "bird" | "fish",
          """
            bird: {"kind":"bird","value":{"name":"Sky","wings":2}}; fish: {"kind":"fish","value":{"name":"Gold","fins":3}}
            """
        > {}
  }
}

/** UE07: A structural variant satisfies two different named base shapes. */
@route("/shared-different-bases")
namespace SharedDifferentBases {
  model Identified {
    id: int32;
  }
  model Shared {
    name: string;
    id: int32;
    active: boolean;
  }
  model Other {
    id: int32;
    code: string;
  }

  @route("/named")
  namespace ByName {
    union UntaggedUnion extends Named {
      shared: Shared,
      cat: Cat,
    }
    @discriminated(#{ envelope: "none" })
    union InlineUnion extends Named {
      shared: Shared,
      cat: Cat,
    }
    @discriminated
    union EnvelopeUnion extends Named {
      shared: Shared,
      cat: Cat,
    }

    @route("/untagged")
    interface Untagged
      extends GetAndPut<
          UntaggedUnion,
          "shared" | "cat",
          """
            shared: {"name":"Shared","id":7,"active":true}; cat: {"name":"Whiskers","meow":true}
            """
        > {}
    @route("/inline")
    interface Inline
      extends GetAndPut<
          InlineUnion,
          "shared" | "cat",
          """
            shared: {"kind":"shared","name":"Shared","id":7,"active":true}; cat: {"kind":"cat","name":"Whiskers","meow":true}
            """
        > {}
    @route("/envelope")
    interface Envelope
      extends GetAndPut<
          EnvelopeUnion,
          "shared" | "cat",
          """
            shared: {"kind":"shared","value":{"name":"Shared","id":7,"active":true}}; cat: {"kind":"cat","value":{"name":"Whiskers","meow":true}}
            """
        > {}
  }

  @route("/identified")
  namespace ById {
    union UntaggedUnion extends Identified {
      entity: Shared,
      other: Other,
    }
    @discriminated(#{ envelope: "none", discriminatorPropertyName: "entityType" })
    union InlineUnion extends Identified {
      entity: Shared,
      other: Other,
    }
    @discriminated(#{ discriminatorPropertyName: "entityType", envelopePropertyName: "entityData" })
    union EnvelopeUnion extends Identified {
      entity: Shared,
      other: Other,
    }

    @route("/untagged")
    interface Untagged
      extends GetAndPut<
          UntaggedUnion,
          "entity" | "other",
          """
            entity: {"name":"Shared","id":7,"active":true}; other: {"id":8,"code":"other"}
            """
        > {}
    @route("/inline")
    interface Inline
      extends GetAndPut<
          InlineUnion,
          "entity" | "other",
          """
            entity: {"entityType":"entity","name":"Shared","id":7,"active":true}; other: {"entityType":"other","id":8,"code":"other"}
            """
        > {}
    @route("/envelope")
    interface Envelope
      extends GetAndPut<
          EnvelopeUnion,
          "entity" | "other",
          """
            entity: {"entityType":"entity","entityData":{"name":"Shared","id":7,"active":true}}; other: {"entityType":"other","entityData":{"id":8,"code":"other"}}
            """
        > {}
  }
}

/** UE09: The base alternative is explicitly listed, never automatically inserted. */
@route("/explicit-base")
namespace ExplicitBase {
  union UntaggedUnion extends Named {
    cat: Cat,
    base: Named,
  }
  @discriminated(#{ envelope: "none" })
  union InlineUnion extends Named {
    cat: Cat,
    base: Named,
  }
  @discriminated
  union EnvelopeUnion extends Named {
    cat: Cat,
    base: Named,
  }

  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "cat" | "base",
        """
          cat: {"name":"Whiskers","meow":true}; base: {"name":"Base"}
          """
      > {}
  @route("/inline")
  interface Inline
    extends GetAndPut<
        InlineUnion,
        "cat" | "base",
        """
          cat: {"kind":"cat","name":"Whiskers","meow":true}; base: {"kind":"base","name":"Base"}
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "cat" | "base",
        """
          cat: {"kind":"cat","value":{"name":"Whiskers","meow":true}}; base: {"kind":"base","value":{"name":"Base"}}
          """
      > {}
}
