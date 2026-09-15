using Http;
using Spector;

namespace Type.Union.Extends;

/** UE10: An explicit unnamed default, not an implicitly inserted base alternative. */
@route("/explicit-default")
namespace ExplicitDefault {
  model UnknownInline extends Named {
    kind: string;
    extra: Record<unknown>;
  }

  @discriminated(#{ envelope: "none" })
  union InlineUnion extends Named {
    cat: Cat,
    dog: Dog,
    UnknownInline,
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

/** UE11a: A union-valued alternative, including every nested leaf. */
@route("/nested-variant")
namespace NestedVariant {
  union UntaggedUnion extends Named {
    pet: DirectInheritance.UntaggedUnion,
    bird: Bird,
  }
  @discriminated
  union EnvelopeUnion extends Named {
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

/** UE11b: A union constraint is distinct from a union-valued alternative. */
@route("/union-constraint")
namespace UnionConstraint {
  union Allowed {
    cat: Cat,
    dog: Dog,
  }
  union UntaggedUnion extends Allowed {
    cat: Cat,
    dog: Dog,
  }
  @discriminated(#{ envelope: "none" })
  union InlineUnion extends Allowed {
    cat: Cat,
    dog: Dog,
  }
  @discriminated
  union EnvelopeUnion extends Allowed {
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

/** UE11c: A union expression constrains two different scalar kinds. */
@route("/union-expression-constraint")
namespace UnionExpressionConstraint {
  union UntaggedUnion extends string | int32 {
    text: string,
    number: int32,
  }
  @discriminated
  union EnvelopeUnion extends string | int32 {
    text: string,
    number: int32,
  }

  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "text" | "number",
        """
          text: "hello"; number: 42
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "text" | "number",
        """
          text: {"kind":"text","value":"hello"}; number: {"kind":"number","value":42}
          """
      > {}
}
