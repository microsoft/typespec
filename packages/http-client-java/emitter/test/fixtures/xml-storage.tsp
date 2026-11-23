import "@typespec/http";
import "@typespec/xml";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

namespace XmlStorage;

namespace Responses {
  model Hierarchy {
    @TypeSpec.Xml.name("Item")
    @TypeSpec.Xml.unwrapped
    items: string[];

    @TypeSpec.Xml.name("Prefix")
    @TypeSpec.Xml.unwrapped
    prefixes?: string[];
  }

  model Layout {
    name: string;
  }

  @get
  @route("/hierarchy")
  op getHierarchy(): {
    @header contentType: "application/xml";
    @body body: Hierarchy;
  };

  @get
  @route("/layout")
  op getLayout():
    | {
        @statusCode statusCode: 200;
        @header contentType: "application/xml";
        @body body: Layout;
      }
    | NoContentResponse;

  @get
  @route("/arrow")
  op getArrow(): {
    @header contentType: "application/vnd.apache.arrow.stream" | "application/xml";
    @body body: bytes;
  };

  @get
  @route("/base64")
  op getBase64(): {
    @header contentType: "application/json";
    @body @encode("base64") body: bytes;
  };

  @get
  @route("/number")
  op getNumber():
    | {
        @statusCode statusCode: 200;
        @body body: int32;
      }
    | NoContentResponse;

  @get
  @route("/base64url")
  op getBase64Url(): {
    @header contentType: "application/json";
    @body @encode("base64url") body: bytes;
  };
}

namespace Records {
  model Configuration is Record<unknown>;

  model Query {
    configuration?: Configuration;
  }

  @post
  op query(@header contentType: "application/xml", @body body: Query): void;
}

namespace AlternateRecords {
  model Configuration is Record<unknown>;
  model EmptyConfiguration {}

  @@alternateType(Configuration, EmptyConfiguration, "java");

  model Query {
    configuration?: Configuration;
  }

  @post
  op query(@header contentType: "application/xml", @body body: Query): void;
}

namespace InlineRecords {
  model Query {
    configuration?: Record<unknown>;
    nullableConfiguration?: Record<unknown> | null;
  }

  @post
  op query(@header contentType: "application/xml", @body body: Query): void;
}

namespace TypedRecords {
  model Query {
    configuration?: Record<string>;
  }

  @post
  op query(@header contentType: "application/xml", @body body: Query): void;
}

namespace JsonRecords {
  model Configuration is Record<unknown>;

  model Query {
    configuration?: Configuration;
    inlineConfiguration?: Record<unknown>;
  }

  @post
  op query(@body body: Query): void;
}
