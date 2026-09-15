using Http;
using Spector;

namespace Type.Union.Extends;

/** UE08: Reuse the exact variant model in unions, direct bodies, and properties. */
@route("/union-and-direct")
namespace UnionAndDirect {
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
  @route("/direct")
  interface Direct
    extends GetAndPut<
        Cat,
        "cat",
        """
          cat: {"name":"Whiskers","meow":true}
          """
      > {}

  model MixedUse {
    direct: Cat;
    untagged: UntaggedUnion;
    inline: InlineUnion;
    envelope: EnvelopeUnion;
  }
  @route("/properties")
  interface Properties
    extends GetAndPut<
        MixedUse,
        "cat" | "dog",
        """
          cat: {"direct":{"name":"Whiskers","meow":true},"untagged":{"name":"Whiskers","meow":true},"inline":{"kind":"cat","name":"Whiskers","meow":true},"envelope":{"kind":"cat","value":{"name":"Whiskers","meow":true}}};
          dog: {"direct":{"name":"Whiskers","meow":true},"untagged":{"name":"Rex","bark":false},"inline":{"kind":"dog","name":"Rex","bark":false},"envelope":{"kind":"dog","value":{"name":"Rex","bark":false}}}
          """
      > {}
}

/** Outer nullability does not add null to the model-constrained union. */
@route("/nullable")
namespace Nullable {
  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        DirectInheritance.UntaggedUnion | null,
        "cat" | "dog" | "null",
        """
          cat: {"name":"Whiskers","meow":true}; dog: {"name":"Rex","bark":false}; null: null
          """
      > {}
  @route("/inline")
  interface Inline
    extends GetAndPut<
        DirectInheritance.InlineUnion | null,
        "cat" | "dog" | "null",
        """
          cat: {"kind":"cat","name":"Whiskers","meow":true}; dog: {"kind":"dog","name":"Rex","bark":false}; null: null
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        DirectInheritance.EnvelopeUnion | null,
        "cat" | "dog" | "null",
        """
          cat: {"kind":"cat","value":{"name":"Whiskers","meow":true}}; dog: {"kind":"dog","value":{"name":"Rex","bark":false}}; null: null
          """
      > {}
}

/** A finite recursive fixture includes both the recursive and terminal alternative. */
@route("/recursive")
namespace Recursive {
  model Leaf extends Named {
    value: int32;
  }
  model UntaggedBranch extends Named {
    children: UntaggedUnion[];
  }
  model EnvelopeBranch extends Named {
    children: EnvelopeUnion[];
  }
  union UntaggedUnion extends Named {
    leaf: Leaf,
    branch: UntaggedBranch,
  }
  @discriminated
  union EnvelopeUnion extends Named {
    leaf: Leaf,
    branch: EnvelopeBranch,
  }
  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "leaf" | "branch",
        """
          leaf: {"name":"Leaf","value":1}; branch: {"name":"Branch","children":[{"name":"Leaf","value":1}]}
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "leaf" | "branch",
        """
          leaf: {"kind":"leaf","value":{"name":"Leaf","value":1}}; branch: {"kind":"branch","value":{"name":"Branch","children":[{"kind":"leaf","value":{"name":"Leaf","value":1}}]}}
          """
      > {}
}

/** Conversions must survive union/direct reuse without leaking tags or envelopes. */
@route("/conversion")
namespace Conversion {
  model EncodedBase {
    @encodedName("application/json", "display_name")
    displayName: string;

    @encode(DateTimeKnownEncoding.unixTimestamp, int64)
    createdAt: utcDateTime;
  }
  model Data extends EncodedBase {
    @encode(BytesKnownEncoding.base64url)
    content: bytes;
  }
  model Count extends EncodedBase {
    count: int32;
  }
  union UntaggedUnion extends EncodedBase {
    data: Data,
    count: Count,
  }
  @discriminated(#{ envelope: "none", discriminatorPropertyName: "dataType" })
  union InlineUnion extends EncodedBase {
    data: Data,
    count: Count,
  }
  @discriminated(#{ discriminatorPropertyName: "dataType", envelopePropertyName: "payload" })
  union EnvelopeUnion extends EncodedBase {
    data: Data,
    count: Count,
  }
  @route("/untagged")
  interface Untagged
    extends GetAndPut<
        UntaggedUnion,
        "data" | "count",
        """
          data: {"display_name":"Data","createdAt":1704067200,"content":"-_8"}; count: {"display_name":"Count","createdAt":1704067200,"count":3}
          """
      > {}
  @route("/inline")
  interface Inline
    extends GetAndPut<
        InlineUnion,
        "data" | "count",
        """
          data: {"dataType":"data","display_name":"Data","createdAt":1704067200,"content":"-_8"}; count: {"dataType":"count","display_name":"Count","createdAt":1704067200,"count":3}
          """
      > {}
  @route("/envelope")
  interface Envelope
    extends GetAndPut<
        EnvelopeUnion,
        "data" | "count",
        """
          data: {"dataType":"data","payload":{"display_name":"Data","createdAt":1704067200,"content":"-_8"}}; count: {"dataType":"count","payload":{"display_name":"Count","createdAt":1704067200,"count":3}}
          """
      > {}
  @route("/direct")
  interface Direct
    extends GetAndPut<
        Data,
        "data",
        """
          data: {"display_name":"Data","createdAt":1704067200,"content":"-_8"}
          """
      > {}
}
