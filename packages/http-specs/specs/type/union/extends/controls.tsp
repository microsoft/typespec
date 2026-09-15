using Http;
using Spector;

/** Matched controls omit only the corresponding union extends clauses. */
@route("/controls")
namespace Type.Union.Extends.Controls;

@route("/direct-inheritance")
namespace DirectInheritance {
  union UntaggedUnion {
    cat: Cat,
    dog: Dog,
  }
  @discriminated(#{ envelope: "none" })
  union InlineUnion {
    cat: Cat,
    dog: Dog,
  }
  @discriminated
  union EnvelopeUnion {
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

@route("/structural")
namespace Structural {
  union UntaggedUnion {
    quiet: Extends.Structural.Quiet,
    calm: Extends.Structural.Calm,
  }
  @discriminated(#{ envelope: "none" })
  union InlineUnion {
    quiet: Extends.Structural.Quiet,
    calm: Extends.Structural.Calm,
  }
  @discriminated
  union EnvelopeUnion {
    quiet: Extends.Structural.Quiet,
    calm: Extends.Structural.Calm,
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

@route("/shared-same-base")
namespace SharedSameBase {
  @route("/first")
  namespace First {
    union UntaggedUnion {
      cat: Cat,
      dog: Dog,
    }
    @discriminated(#{ envelope: "none" })
    union InlineUnion {
      cat: Cat,
      dog: Dog,
    }
    @discriminated
    union EnvelopeUnion {
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
    union UntaggedUnion {
      feline: Cat,
      bird: Bird,
    }
    @discriminated(#{ envelope: "none", discriminatorPropertyName: "petType" })
    union InlineUnion {
      feline: Cat,
      bird: Bird,
    }
    @discriminated(#{ discriminatorPropertyName: "animal", envelopePropertyName: "data" })
    union EnvelopeUnion {
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

@route("/explicit-default")
namespace ExplicitDefault {
  @discriminated(#{ envelope: "none" })
  union InlineUnion {
    cat: Cat,
    dog: Dog,
    Extends.ExplicitDefault.UnknownInline,
  }
  @route("/inline")
  interface Inline
    extends GetAndPut<
        InlineUnion,
        "cat" | "dog" | "unknown",
        """
          cat: {"kind":"cat","name":"Whiskers","meow":true}; dog: {"kind":"dog","name":"Rex","bark":false}; unknown: {"kind":"dragon","name":"Future","extra":{"color":"gold","size":3,"nested":{"active":true}}}
          """
      > {}
}

@route("/nested-variant")
namespace NestedVariant {
  union UntaggedUnion {
    pet: DirectInheritance.UntaggedUnion,
    bird: Bird,
  }
  @discriminated
  union EnvelopeUnion {
    pet: DirectInheritance.EnvelopeUnion,
    bird: Bird,
  }
  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "cat" | "dog" | "bird",
        """
          cat: {"name":"Whiskers","meow":true}; dog: {"name":"Rex","bark":false}; bird: {"name":"Sky","wings":2}
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "cat" | "dog" | "bird",
        """
          cat: {"kind":"pet","value":{"kind":"cat","value":{"name":"Whiskers","meow":true}}}; dog: {"kind":"pet","value":{"kind":"dog","value":{"name":"Rex","bark":false}}}; bird: {"kind":"bird","value":{"name":"Sky","wings":2}}
          """
      > {}
}

@route("/closed-scalar")
namespace ClosedScalar {
  union UntaggedUnion {
    start: "start",
    stop: "stop",
  }
  @discriminated
  union EnvelopeUnion {
    start: "start",
    stop: "stop",
  }
  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "start" | "stop",
        """
          start: "start"; stop: "stop"
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "start" | "stop",
        """
          start: {"kind":"start","value":"start"}; stop: {"kind":"stop","value":"stop"}
          """
      > {}
}

@route("/open-scalar")
namespace OpenScalar {
  union UntaggedUnion {
    known: "known",
    custom: string,
  }
  @discriminated
  union EnvelopeUnion {
    known: "known",
    custom: string,
  }
  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "known" | "custom",
        """
          known: "known"; custom: "future"
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "known" | "custom",
        """
          known: {"kind":"known","value":"known"}; custom: {"kind":"custom","value":"future"}
          """
      > {}
}
