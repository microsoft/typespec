using Http;
using Spector;

namespace Type.Union.Extends;

/** UE12a: The scalar constraint does not make literal alternatives open. */
@route("/closed-scalar")
namespace ClosedScalar {
  union UntaggedUnion extends string {
    start: "start",
    stop: "stop",
  }
  @discriminated
  union EnvelopeUnion extends string {
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

/** UE12b: Openness comes from the explicitly listed string variant. */
@route("/open-scalar")
namespace OpenScalar {
  union UntaggedUnion extends string {
    known: "known",
    custom: string,
  }
  @discriminated
  union EnvelopeUnion extends string {
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

/** UE12c: Enum members satisfy their declared enum constraint. */
@route("/enum")
namespace EnumConstraint {
  enum Direction {
    left,
    right,
  }
  union UntaggedUnion extends Direction {
    left: Direction.left,
    right: Direction.right,
  }
  @discriminated
  union EnvelopeUnion extends Direction {
    left: Direction.left,
    right: Direction.right,
  }

  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "left" | "right",
        """
          left: "left"; right: "right"
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "left" | "right",
        """
          left: {"kind":"left","value":"left"}; right: {"kind":"right","value":"right"}
          """
      > {}
}

/** UE12d: Array bodies are not synthetic object models or inline discriminators. */
@route("/array")
namespace ArrayConstraint {
  union UntaggedUnion extends Named[] {
    cats: Cat[],
    dogs: Dog[],
  }
  @discriminated
  union EnvelopeUnion extends Named[] {
    cats: Cat[],
    dogs: Dog[],
  }

  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "cats" | "dogs",
        """
          cats: [{"name":"Whiskers","meow":true}]; dogs: [{"name":"Rex","bark":false}]
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "cats" | "dogs",
        """
          cats: {"kind":"cats","value":[{"name":"Whiskers","meow":true}]}; dogs: {"kind":"dogs","value":[{"name":"Rex","bark":false}]}
          """
      > {}
}

/** UE12e: An intersection of named models, not an anonymous model-expression base. */
@route("/intersection")
namespace IntersectionConstraint {
  model Identified {
    id: int32;
  }
  model First {
    name: string;
    id: int32;
    text: string;
  }
  model Second {
    name: string;
    id: int32;
    count: int32;
  }
  union UntaggedUnion extends Named & Identified {
    first: First,
    second: Second,
  }
  @discriminated(#{ envelope: "none" })
  union InlineUnion extends Named & Identified {
    first: First,
    second: Second,
  }
  @discriminated
  union EnvelopeUnion extends Named & Identified {
    first: First,
    second: Second,
  }

  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "first" | "second",
        """
          first: {"name":"First","id":1,"text":"hello"}; second: {"name":"Second","id":2,"count":3}
          """
      > {}
  @route("/inline")
  interface Inline
    extends GetAndPut<
        InlineUnion,
        "first" | "second",
        """
          first: {"kind":"first","name":"First","id":1,"text":"hello"}; second: {"kind":"second","name":"Second","id":2,"count":3}
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "first" | "second",
        """
          first: {"kind":"first","value":{"name":"First","id":1,"text":"hello"}}; second: {"kind":"second","value":{"name":"Second","id":2,"count":3}}
          """
      > {}
}

/** UE12f: A concrete named model template instance supplies the constraint. */
@route("/template-instance")
namespace TemplateInstance {
  model Wrapper<T> {
    item: T;
  }
  model First extends Wrapper<string> {
    label: string;
  }
  model Second extends Wrapper<string> {
    active: boolean;
  }
  union UntaggedUnion extends Wrapper<string> {
    first: First,
    second: Second,
  }
  @discriminated(#{ envelope: "none" })
  union InlineUnion extends Wrapper<string> {
    first: First,
    second: Second,
  }
  @discriminated
  union EnvelopeUnion extends Wrapper<string> {
    first: First,
    second: Second,
  }

  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "first" | "second",
        """
          first: {"item":"one","label":"First"}; second: {"item":"two","active":true}
          """
      > {}
  @route("/inline")
  interface Inline
    extends GetAndPut<
        InlineUnion,
        "first" | "second",
        """
          first: {"kind":"first","item":"one","label":"First"}; second: {"kind":"second","item":"two","active":true}
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "first" | "second",
        """
          first: {"kind":"first","value":{"item":"one","label":"First"}}; second: {"kind":"second","value":{"item":"two","active":true}}
          """
      > {}
}
