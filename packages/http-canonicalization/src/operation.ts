import type { MemberType, ModelProperty, Operation } from "@typespec/compiler";
import {
  resolveRequestVisibility,
  Visibility,
  type HttpOperation,
  type HttpVerb,
} from "@typespec/http";
import "@typespec/http/experimental/typekit";

import {
  MutationHalfEdge,
  OperationMutation,
  type MutationNodeForType,
  type MutationTraits,
} from "@typespec/mutator-framework";
import type {
  HttpCanonicalization,
  HttpCanonicalizationMutations,
} from "./http-canonicalization-classes.js";
import type {
  CanonicalizationPredicate,
  HttpCanonicalizationCommon,
  HttpCanonicalizationInfo,
  HttpCanonicalizer,
} from "./http-canonicalization.js";
import type { ModelPropertyHttpCanonicalization } from "./model-property.js";
import type { ModelHttpCanonicalization } from "./model.js";
import { HttpCanonicalizationOptions } from "./options.js";
import type { ScalarHttpCanonicalization } from "./scalar.js";

/** Header serialization metadata copied from HTTP resolution, not language-side names. */
export interface CanonicalHeaderParameterOptions {
  /** Identifies these options as header options rather than cookie options. */
  type: "header";
  /** HTTP header field name, including any name override from `@header`. */
  name: string;
  /**
   * Equivalent of adding `*` in the path parameter as per [RFC-6570](https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.3)
   *
   *  | Style  | Explode | Primitive value = 5 | Array = [3, 4, 5] | Object = {"role": "admin", "firstName": "Alex"} |
   *  | ------ | ------- | ------------------- | ----------------- | ----------------------------------------------- |
   *  | simple | false   | `id=5`              | `3,4,5`           | `role,admin,firstName,Alex`                     |
   *  | simple | true    | `id=5`              | `3,4,5`           | `role=admin,firstName=Alex`                     |
   *
   */
  explode?: boolean;
}

/** Cookie metadata for a canonicalized request property. */
export interface CanonicalCookieParameterOptions {
  /** Identifies these options as cookie options rather than header options. */
  type: "cookie";
  /** Cookie name sent in the request, independent of the language property name. */
  name: string;
}

/** Resolved query expansion settings for a canonicalized request property. */
export interface CanonicalQueryParameterOptions {
  /** Query parameter name used in the URI template. */
  readonly name: string;
  /** Whether array or object members expand separately using URI-template `*` semantics. */
  readonly explode: boolean;
}

/** Resolved URI-template expansion settings for a canonicalized path property. */
export interface CanonicalPathParameterOptions {
  /** Variable name used in the URI template, not a renamed language property name. */
  readonly name: string;
  /** Whether structured values use URI-template `*` expansion. */
  readonly explode: boolean;
  /** URI-template expansion style controlling separators and prefixes. */
  readonly style: "simple" | "label" | "matrix" | "fragment" | "path";
  /** Whether reserved URI characters may remain unescaped during expansion. */
  readonly allowReserved: boolean;
}

/** HTTP role of a canonicalized request or response property; narrow using `kind`. */
export type CanonicalHttpProperty =
  | CanonicalHeaderProperty
  | CanonicalCookieProperty
  | CanonicalQueryProperty
  | CanonicalPathProperty
  | CanonicalContentTypeProperty
  | CanonicalStatusCodeProperty
  | CanonicalBodyProperty
  | CanonicalBodyRootProperty
  | CanonicalMultipartBodyProperty
  | CanonicalBodyPropertyProperty;

/** Links an HTTP role to a canonical property and its position in the source shape. */
export interface CanonicalHttpPropertyBase {
  /** Canonicalization exposing the source property and its language and wire projections. */
  readonly property: ModelPropertyHttpCanonicalization;
  /** Path from the root of the operation parameters/returnType to the property. */
  readonly path: (string | number)[];
}
/** A property carried in an HTTP header rather than the payload body. */
export interface CanonicalHeaderProperty extends CanonicalHttpPropertyBase {
  /** Selects the header branch of {@link CanonicalHttpProperty}. */
  readonly kind: "header";
  /** Resolved wire name and structured-value expansion behavior. */
  readonly options: CanonicalHeaderParameterOptions;
}
/** A request property carried as a cookie. */
export interface CanonicalCookieProperty extends CanonicalHttpPropertyBase {
  /** Selects the cookie branch of {@link CanonicalHttpProperty}. */
  readonly kind: "cookie";
  /** Resolved cookie wire name. */
  readonly options: CanonicalCookieParameterOptions;
}
/** A property that selects the payload media type through `Content-Type`. */
export interface CanonicalContentTypeProperty extends CanonicalHttpPropertyBase {
  /** Separates content negotiation metadata from ordinary headers. */
  readonly kind: "contentType";
}

/** A request property expanded into the URI query. */
export interface CanonicalQueryProperty extends CanonicalHttpPropertyBase {
  /** Selects the query branch of {@link CanonicalHttpProperty}. */
  readonly kind: "query";
  /** Resolved query name and expansion behavior. */
  readonly options: CanonicalQueryParameterOptions;
}

/** A request property expanded into the URI path. */
export interface CanonicalPathProperty extends CanonicalHttpPropertyBase {
  /** Selects the path branch of {@link CanonicalHttpProperty}. */
  readonly kind: "path";
  /** Resolved URI-template expansion behavior and wire name. */
  readonly options: CanonicalPathParameterOptions;
}

/** A response property describing the HTTP status, not a payload field. */
export interface CanonicalStatusCodeProperty extends CanonicalHttpPropertyBase {
  /** Selects status metadata in {@link CanonicalHttpProperty}. */
  readonly kind: "statusCode";
}
/** An explicit `@body` property supplying the entire payload. */
export interface CanonicalBodyProperty extends CanonicalHttpPropertyBase {
  /** Distinguishes an explicit body from a body root or implicit body member. */
  readonly kind: "body";
}
/** A `@bodyRoot` property whose type supplies the payload root. */
export interface CanonicalBodyRootProperty extends CanonicalHttpPropertyBase {
  /** Distinguishes a body root from an explicit `@body` property. */
  readonly kind: "bodyRoot";
}
/** A property annotated with `@multipartBody` that supplies multipart content. */
export interface CanonicalMultipartBodyProperty extends CanonicalHttpPropertyBase {
  /** Selects a multipart body declaration in {@link CanonicalHttpProperty}. */
  readonly kind: "multipartBody";
}
/** Property to include inside the body */
export interface CanonicalBodyPropertyProperty extends CanonicalHttpPropertyBase {
  /** Distinguishes an implicit payload field from a property supplying the whole body. */
  readonly kind: "bodyProperty";
}

type HttpOperationResponseInfo = HttpOperation["responses"][number];
type HttpOperationResponseContentInfo = HttpOperationResponseInfo["responses"][number];
type HttpOperationPropertyInfo =
  | HttpOperationResponseContentInfo["properties"][number]
  | HttpOperation["parameters"]["properties"][number];
type HttpOperationRequestBodyInfo = NonNullable<HttpOperation["parameters"]["body"]>;
type HttpOperationResponseBodyInfo = NonNullable<HttpOperationResponseContentInfo["body"]>;
type HttpPayloadBodyInfo = HttpOperationRequestBodyInfo | HttpOperationResponseBodyInfo;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type HttpOperationBodyInfo = Extract<HttpPayloadBodyInfo, { bodyKind: "single" }>;
type HttpOperationMultipartBodyInfo = Extract<HttpPayloadBodyInfo, { bodyKind: "multipart" }>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type HttpOperationFileBodyInfo = Extract<HttpPayloadBodyInfo, { bodyKind: "file" }>;
type HttpOperationMultipartPartInfo = HttpOperationMultipartBodyInfo["parts"][number];
type HttpOperationMultipartPartBodyInfo = HttpOperationMultipartPartInfo["body"];

/** Request metadata after applying the operation's resolved request visibility. */
interface CanonicalHttpOperationParameters {
  /** Payload description, absent when the request has no body. */
  body?: CanonicalHttpPayloadBody;
  /** All resolved HTTP property roles in resolver order, including body declarations. */
  properties: CanonicalHttpProperty[];
}

/** Response alternatives grouped by a status code, range, or wildcard. */
export interface CanonicalHttpOperationResponse {
  /**
   * Status code or range of status code for the response.
   */
  readonly statusCodes: HttpOperationResponseInfo["statusCodes"];
  /**
   * Canonicalized response TypeSpec type.
   */
  readonly type: HttpCanonicalization;
  /**
   * Response description.
   */
  readonly description?: string;
  /**
   * Response contents.
   */
  readonly responses: CanonicalHttpOperationResponseContent[];
}

/** One response content alternative, with headers and an optional payload. */
export interface CanonicalHttpOperationResponseContent {
  /** Canonical HTTP properties for this response */
  readonly properties: CanonicalHttpProperty[];
  /** Canonical headers keyed by HTTP field name; absent when none are present. */
  readonly headers?: Record<string, ModelPropertyHttpCanonicalization>;
  /** Payload metadata, absent for a response without a body. */
  readonly body?: CanonicalHttpPayloadBody;
}

/** Payload forms distinguished by `bodyKind`: ordinary content, multipart, or file. */
export type CanonicalHttpPayloadBody =
  CanonicalHttpOperationBody | CanonicalHttpOperationMultipartBody | CanonicalHttpOperationFileBody;

/** Media-type and property metadata shared by request and response body forms. */
export interface CanonicalHttpOperationBodyBase {
  /** Resolved media types in HTTP resolver order; for a file, its inner media types. */
  readonly contentTypes: string[];
  /** Property used to set the content type if exists */
  readonly contentTypeProperty?: ModelPropertyHttpCanonicalization;
  /**
   * The payload property that defined this body, if any.
   */
  readonly property?: ModelPropertyHttpCanonicalization;
}

/** One ordinary body's representation under a specific media type and visibility. */
export interface CanonicalHttpBodyForContentType {
  /** The content type for this canonicalization. */
  readonly contentType: string;
  /** The canonicalized type for this content type. */
  readonly type: HttpCanonicalization;
  /** The canonicalized property for this content type, if any. */
  readonly property?: ModelPropertyHttpCanonicalization;
}

/** Ordinary payload metadata with a separate canonicalization for each media type. */
export interface CanonicalHttpBody {
  /** If the body was explicitly set with `@body`. */
  readonly isExplicit: boolean;
  /** If the body contains metadata annotations to ignore. */
  readonly containsMetadataAnnotations: boolean;
  /** One entry per resolved content type, preserving `contentTypes` order. */
  readonly bodies: CanonicalHttpBodyForContentType[];
}

/** A non-multipart, non-file payload, whether explicit or inferred from properties. */
export interface CanonicalHttpOperationBody
  extends CanonicalHttpOperationBodyBase, CanonicalHttpBody {
  /** Selects the ordinary-payload branch of {@link CanonicalHttpPayloadBody}. */
  readonly bodyKind: "single";
}

/** Multipart payload declared using either named model properties or tuple entries. */
export type CanonicalHttpOperationMultipartBody =
  CanonicalHttpOperationMultipartBodyModel | CanonicalHttpOperationMultipartBodyTuple;

/** Metadata shared by both model-form and tuple-form multipart payloads. */
export interface CanonicalHttpOperationMultipartBodyCommon extends CanonicalHttpOperationBodyBase {
  /** Selects the multipart branch of {@link CanonicalHttpPayloadBody}. */
  readonly bodyKind: "multipart";
  /** Property annotated with `@multipartBody` */
  readonly property: ModelPropertyHttpCanonicalization;
  /** Canonical parts in the order provided by HTTP resolution. */
  readonly parts: CanonicalHttpOperationPart[];
}

/** Multipart content whose parts originate in named model properties. */
export interface CanonicalHttpOperationMultipartBodyModel extends CanonicalHttpOperationMultipartBodyCommon {
  /** Selects the named-property multipart form. */
  readonly multipartKind: "model";
  /** Canonicalization of the model defining the parts. */
  readonly type: ModelHttpCanonicalization;
  /** Named parts, each retaining its defining model property. */
  readonly parts: CanonicalHttpOperationModelPart[];
}

/** Multipart content whose parts originate in ordered tuple entries. */
export interface CanonicalHttpOperationMultipartBodyTuple extends CanonicalHttpOperationMultipartBodyCommon {
  /** Selects the tuple-entry multipart form. */
  readonly multipartKind: "tuple";
  /** Canonicalization of the tuple defining the parts. */
  readonly type: HttpCanonicalization;
  /** Tuple parts in entry order; a part name need not be present. */
  readonly parts: CanonicalHttpOperationTuplePart[];
}

/** A multipart part's payload can be ordinary content or a file, but not multipart. */
export type CanonicalHttpOperationMultipartPartBody =
  CanonicalHttpOperationBody | CanonicalHttpOperationFileBody;

/** Per-part payload, headers, and cardinality for either multipart declaration form. */
export interface CanonicalHttpOperationPartCommon {
  /** Part body */
  readonly body: CanonicalHttpOperationMultipartPartBody;
  /** If the Part is an HttpFile this is the property defining the filename */
  readonly filename?: ModelPropertyHttpCanonicalization;
  /** Part headers */
  readonly headers: CanonicalHeaderProperty[];
  /** If there can be multiple of that part */
  readonly multi: boolean;
  /** The part name, if any. */
  readonly name?: string;
  /** If the part is optional */
  readonly optional: boolean;
}

/** Multipart part distinguished by whether a model property or tuple entry defines it. */
export type CanonicalHttpOperationPart =
  CanonicalHttpOperationModelPart | CanonicalHttpOperationTuplePart;

/** Named multipart part retaining the canonical property that declared it. */
export interface CanonicalHttpOperationModelPart extends CanonicalHttpOperationPartCommon {
  /** Selects the model-property part form. */
  readonly partKind: "model";
  /** Property that defined the part if the model form is used. */
  readonly property: ModelPropertyHttpCanonicalization;
  /** Part name */
  readonly name: string;
}

/** Multipart part from a tuple entry, with no defining model property. */
export interface CanonicalHttpOperationTuplePart extends CanonicalHttpOperationPartCommon {
  /** Selects the tuple-entry part form. */
  readonly partKind: "tuple";
  /** Property that defined the part -- always undefined for tuple entry parts. */
  readonly property?: undefined;
}

/** Upload or download payload derived from `Http.File`, including its metadata fields. */
export interface CanonicalHttpOperationFileBody extends CanonicalHttpOperationBodyBase {
  /** Selects the file branch of {@link CanonicalHttpPayloadBody}. */
  readonly bodyKind: "file";
  /**
   * The model type of the body that is or extends `Http.File`.
   */
  readonly type: ModelHttpCanonicalization;
  /**
   * Whether the file contents should be represented as a string or raw byte stream.
   */
  readonly isText: boolean;
  /**
   * The list of inner media types of the file.
   */
  readonly contentTypes: string[];
  /** The `contentType` property. */
  readonly contentTypeProperty: ModelPropertyHttpCanonicalization;
  /** The filename property. */
  readonly filename: ModelPropertyHttpCanonicalization;
  /** The `contents` property. */
  readonly contents: ModelPropertyHttpCanonicalization & {
    /** Scalar canonicalization for the file's string or byte contents. */
    readonly type: ScalarHttpCanonicalization;
  };
}

/**
 * Canonicalizes operations by deriving HTTP-specific request and response shapes.
 */
export class OperationHttpCanonicalization
  extends OperationMutation<
    HttpCanonicalizationOptions,
    HttpCanonicalizationMutations,
    HttpCanonicalizer
  >
  implements HttpCanonicalizationCommon
{
  /**
   * Cached HTTP metadata for this operation.
   */
  #httpOperationInfo: HttpOperation;
  codec = null;
  isDeclaration: boolean = true;
  /**
   * Canonicalized request parameters grouped by location.
   */
  requestParameters!: CanonicalHttpOperationParameters;
  /**
   * Canonicalized header parameters for the request.
   */
  requestHeaders: CanonicalHeaderProperty[] = [];
  /**
   * Canonicalized query parameters for the request.
   */
  queryParameters: CanonicalQueryProperty[] = [];
  /**
   * Canonicalized path parameters for the request.
   */
  pathParameters: CanonicalPathProperty[] = [];
  /**
   * Canonicalized responses produced by the operation.
   */
  responses: CanonicalHttpOperationResponse[] = [];
  /**
   * Concrete path for the HTTP operation.
   */
  path: string;
  /**
   * URI template used for path and query expansion.
   */
  uriTemplate: string;
  /**
   * Visibility applied when canonicalizing request parameters.
   */
  parameterVisibility: Visibility;
  /**
   * Visibility applied when canonicalizing response payloads.
   */
  returnTypeVisibility: Visibility;
  /**
   * HTTP method verb for the operation.
   */
  method: HttpVerb;
  /**
   * Name assigned to the canonicalized operation.
   */
  name: string;

  #languageMutationNode: MutationNodeForType<Operation>;
  #wireMutationNode: MutationNodeForType<Operation>;

  /**
   * The language mutation node for this operation.
   */
  get languageMutationNode() {
    return this.#languageMutationNode;
  }

  /**
   * The wire mutation node for this operation.
   */
  get wireMutationNode() {
    return this.#wireMutationNode;
  }

  /**
   * The language type for this operation.
   */
  get languageType() {
    return this.#languageMutationNode.mutatedType;
  }

  /**
   * The wire type for this operation.
   */
  get wireType() {
    return this.#wireMutationNode.mutatedType;
  }

  /**
   * Tests whether the subgraph rooted at this canonicalization uses only
   * the identity codec (no transformation).
   */
  subgraphUsesIdentityCodec(): boolean {
    return this.engine.subgraphUsesIdentityCodec(this);
  }

  /**
   * Tests whether the subgraph rooted at this canonicalization satisfies
   * the provided predicate.
   */
  subgraphMatchesPredicate(predicate: CanonicalizationPredicate): boolean {
    return this.engine.subgraphMatchesPredicate(this, predicate);
  }

  /**
   * Supplies the operation's option-based cache key and synthetic trait to the
   * mutation engine. Operations do not select an encoding codec.
   */
  static mutationInfo(
    engine: HttpCanonicalizer,
    sourceType: Operation,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    halfEdge?: MutationHalfEdge<any, any>,
    traits?: MutationTraits,
  ): HttpCanonicalizationInfo {
    return {
      mutationKey: options.mutationKey,
      codec: null as any, // Operations don't need a codec
      isSynthetic: traits?.isSynthetic,
    };
  }

  /**
   * Initializes operation projections and resolves HTTP routing metadata.
   * Use {@link HttpCanonicalizer.canonicalize} to also populate request and
   * response descriptors and reuse cached canonicalizations.
   */
  constructor(
    engine: HttpCanonicalizer,
    sourceType: Operation,
    referenceTypes: MemberType[] = [],
    options: HttpCanonicalizationOptions,
    info: HttpCanonicalizationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#languageMutationNode = this.engine.getMutationNode(
      this.sourceType,
      info.mutationKey + "-language",
    );
    this.#wireMutationNode = this.engine.getMutationNode(
      this.sourceType,
      info.mutationKey + "-wire",
    );

    this.#httpOperationInfo = this.engine.$.httpOperation.get(this.sourceType);
    this.uriTemplate = this.#httpOperationInfo.uriTemplate;
    this.path = this.#httpOperationInfo.path;
    this.parameterVisibility = resolveRequestVisibility(
      this.engine.$.program,
      this.sourceType,
      this.#httpOperationInfo.verb,
    );
    this.returnTypeVisibility = Visibility.Read;
    this.name = this.sourceType.name;
    this.method = this.#httpOperationInfo.verb;
  }

  protected startParametersEdge(): MutationHalfEdge {
    return new MutationHalfEdge("parameters", this, (tail) => {
      this.#languageMutationNode.connectParameters(tail.languageMutationNode);
      this.#wireMutationNode.connectParameters(tail.wireMutationNode);
    });
  }

  protected startReturnTypeEdge(): MutationHalfEdge {
    return new MutationHalfEdge("returnType", this, (tail) => {
      this.#languageMutationNode.connectReturnType(tail.languageMutationNode);
      this.#wireMutationNode.connectReturnType(tail.wireMutationNode);
    });
  }

  /**
   * Canonicalize this mutation for HTTP.
   */
  mutate() {
    this.#httpOperationInfo = this.engine.$.httpOperation.get(this.sourceType);

    this.uriTemplate = this.#httpOperationInfo.uriTemplate;
    this.path = this.#httpOperationInfo.path;
    this.parameterVisibility = resolveRequestVisibility(
      this.engine.$.program,
      this.sourceType,
      this.#httpOperationInfo.verb,
    );
    this.returnTypeVisibility = Visibility.Read;
    this.name = this.sourceType.name;
    this.method = this.#httpOperationInfo.verb;

    // unpack parameter info
    this.requestParameters = {
      properties: [],
    };

    const paramInfo = this.#httpOperationInfo.parameters;

    if (paramInfo.body) {
      this.requestParameters.body = this.#canonicalizeBody(
        paramInfo.body,
        this.parameterVisibility,
      );
    }

    for (const param of paramInfo.properties) {
      this.requestParameters.properties.push(
        this.#canonicalizeHttpProperty(param, this.parameterVisibility, paramInfo.body),
      );
    }

    this.pathParameters = this.requestParameters.properties.filter(
      (p) => p.kind === "path",
    ) as CanonicalPathProperty[];

    this.requestHeaders = this.requestParameters.properties.filter(
      (p) => p.kind === "header",
    ) as CanonicalHeaderProperty[];

    this.queryParameters = this.requestParameters.properties.filter(
      (p) => p.kind === "query",
    ) as CanonicalQueryProperty[];

    // unpack response info
    const responseInfo = this.#httpOperationInfo.responses;
    this.responses = responseInfo.map((response) => this.#canonicalizeResponse(response));
  }

  /**
   * Canonicalizes an HTTP operation response container.
   */
  #canonicalizeResponse(response: HttpOperationResponseInfo): CanonicalHttpOperationResponse {
    return {
      statusCodes: response.statusCodes,
      type: this.engine.canonicalize(response.type, {
        visibility: this.returnTypeVisibility,
      }) as HttpCanonicalization,
      description: response.description,
      responses: response.responses.map((content) => this.#canonicalizeResponseContent(content)),
    };
  }

  /**
   * Canonicalizes a single response content entry.
   */
  #canonicalizeResponseContent(
    content: HttpOperationResponseContentInfo,
  ): CanonicalHttpOperationResponseContent {
    const canonicalHeaders: Record<string, ModelPropertyHttpCanonicalization> = {};
    if (content.headers) {
      for (const [name, header] of Object.entries(content.headers) as [
        string,
        NonNullable<HttpOperationResponseContentInfo["headers"]>[string],
      ][]) {
        canonicalHeaders[name] = this.#canonicalizeModelProperty(header, this.returnTypeVisibility);
      }
    }

    return {
      properties: content.properties.map((property) =>
        this.#canonicalizeHttpProperty(property, this.returnTypeVisibility, content.body),
      ),
      headers: Object.keys(canonicalHeaders).length > 0 ? canonicalHeaders : undefined,

      body: content.body
        ? this.#canonicalizeBody(content.body, this.returnTypeVisibility)
        : undefined,
    };
  }

  /**
   * Canonicalizes an HTTP property descriptor.
   */
  #canonicalizeHttpProperty(
    property: HttpOperationPropertyInfo,
    visibility: Visibility,
    bodyInfo?: HttpPayloadBodyInfo,
  ): CanonicalHttpProperty {
    // For body-related properties, we need to pass the content type from the body info
    const contentType =
      bodyInfo &&
      (property.kind === "body" ||
        property.kind === "bodyRoot" ||
        property.kind === "multipartBody" ||
        property.kind === "bodyProperty")
        ? bodyInfo.contentTypes[0]
        : undefined;

    const canonicalProperty = this.#canonicalizeModelProperty(
      property.property,
      visibility,
      contentType,
    );

    switch (property.kind) {
      case "header":
        return {
          kind: "header",
          property: canonicalProperty,
          path: property.path,
          options: {
            type: "header",
            name: property.options.name,
            explode: property.options.explode,
          },
        };
      case "cookie":
        return {
          kind: "cookie",
          property: canonicalProperty,
          path: property.path,
          options: {
            type: "cookie",
            name: property.options.name,
          },
        };
      case "query":
        return {
          kind: "query",
          property: canonicalProperty,
          path: property.path,
          options: {
            name: property.options.name,
            explode: property.options.explode,
          },
        };
      case "path":
        return {
          kind: "path",
          property: canonicalProperty,
          path: property.path,
          options: {
            name: property.options.name,
            explode: property.options.explode,
            style: property.options.style,
            allowReserved: property.options.allowReserved,
          },
        };
      case "contentType":
        return {
          kind: "contentType",
          property: canonicalProperty,
          path: property.path,
        };
      case "statusCode":
        return {
          kind: "statusCode",
          property: canonicalProperty,
          path: property.path,
        };
      case "body":
        return {
          kind: "body",
          property: canonicalProperty,
          path: property.path,
        };
      case "bodyRoot":
        return {
          kind: "bodyRoot",
          property: canonicalProperty,
          path: property.path,
        };
      case "multipartBody":
        return {
          kind: "multipartBody",
          property: canonicalProperty,
          path: property.path,
        };
      case "bodyProperty":
        return {
          kind: "bodyProperty",
          property: canonicalProperty,
          path: property.path,
        };
      default:
        throw new Error(`Unsupported HTTP property kind: ${(property as { kind: string }).kind}`);
    }
  }

  /**
   * Canonicalizes the operation's request or response body metadata.
   */
  #canonicalizeBody(body: HttpPayloadBodyInfo, visibility: Visibility): CanonicalHttpPayloadBody {
    switch (body.bodyKind) {
      case "single":
        return {
          bodyKind: "single",
          contentTypes: body.contentTypes,
          contentTypeProperty: body.contentTypeProperty
            ? this.#canonicalizeModelProperty(body.contentTypeProperty, visibility)
            : undefined,
          isExplicit: body.isExplicit,
          containsMetadataAnnotations: body.containsMetadataAnnotations,
          bodies: body.contentTypes.map((contentType) => ({
            contentType,
            type: this.engine.canonicalize(body.type, {
              visibility,
              contentType,
            }) as HttpCanonicalization,
            property: body.property
              ? this.#canonicalizeModelProperty(body.property, visibility, contentType)
              : undefined,
          })),
        } satisfies CanonicalHttpOperationBody;
      case "multipart":
        return this.#canonicalizeMultipartBody(body, visibility);
      case "file":
        return {
          bodyKind: "file",
          contentTypes: body.contentTypes,
          contentTypeProperty: this.#canonicalizeModelProperty(
            body.contentTypeProperty,
            visibility,
          ),
          property: body.property
            ? this.#canonicalizeModelProperty(body.property, visibility)
            : undefined,
          type: this.engine.canonicalize(body.type, {
            visibility,
          }) as ModelHttpCanonicalization,
          isText: body.isText,
          filename: this.#canonicalizeModelProperty(body.filename, visibility),
          contents: this.#canonicalizeModelProperty(
            body.contents,
            visibility,
          ) as ModelPropertyHttpCanonicalization & {
            readonly type: ScalarHttpCanonicalization;
          },
        } satisfies CanonicalHttpOperationFileBody;
      default:
        return this.#assertNever(body);
    }
  }

  /**
   * Canonicalizes multipart payload metadata.
   */
  #canonicalizeMultipartBody(
    body: HttpOperationMultipartBodyInfo,
    visibility: Visibility,
  ): CanonicalHttpOperationMultipartBody {
    const property = this.#canonicalizeModelProperty(body.property, visibility);
    const parts = body.parts.map((part) => this.#canonicalizeMultipartPart(part, visibility));

    const base = {
      bodyKind: "multipart" as const,
      contentTypes: body.contentTypes,
      contentTypeProperty: body.contentTypeProperty
        ? this.#canonicalizeModelProperty(body.contentTypeProperty, visibility)
        : undefined,
      property,
      parts,
    } satisfies CanonicalHttpOperationMultipartBodyCommon;

    if (body.multipartKind === "model") {
      return {
        ...base,
        multipartKind: "model",
        parts: parts as CanonicalHttpOperationModelPart[],
        type: this.engine.canonicalize(body.type, {
          visibility,
        }) as ModelHttpCanonicalization,
      } satisfies CanonicalHttpOperationMultipartBodyModel;
    }

    return {
      ...base,
      multipartKind: "tuple",
      parts: parts as CanonicalHttpOperationTuplePart[],
      type: this.engine.canonicalize(body.type, {
        visibility,
      }) as HttpCanonicalization,
    } satisfies CanonicalHttpOperationMultipartBodyTuple;
  }

  /**
   * Canonicalizes a multipart part definition.
   */
  #canonicalizeMultipartPart(
    part: HttpOperationMultipartPartInfo,
    visibility: Visibility,
  ): CanonicalHttpOperationPart {
    const base: CanonicalHttpOperationPartCommon = {
      body: this.#canonicalizeMultipartPartBody(part.body, visibility),
      headers: part.headers.map(
        (header) => this.#canonicalizeHttpProperty(header, visibility) as CanonicalHeaderProperty,
      ),
      multi: part.multi,
      optional: part.optional,
      name: part.name,
      filename: part.filename
        ? this.#canonicalizeModelProperty(part.filename, visibility)
        : undefined,
    };

    if (part.partKind === "model") {
      return {
        ...base,
        partKind: "model",
        property: this.#canonicalizeModelProperty(part.property, visibility),
        name: part.name,
      } satisfies CanonicalHttpOperationModelPart;
    }

    return {
      ...base,
      partKind: "tuple",
      property: undefined,
    } satisfies CanonicalHttpOperationTuplePart;
  }

  /**
   * Canonicalizes the body associated with a multipart part.
   */
  #canonicalizeMultipartPartBody(
    body: HttpOperationMultipartPartBodyInfo,
    visibility: Visibility,
  ): CanonicalHttpOperationMultipartPartBody {
    if (body.bodyKind === "file") {
      return this.#canonicalizeBody(body, visibility) as CanonicalHttpOperationFileBody;
    }

    return this.#canonicalizeBody(body, visibility) as CanonicalHttpOperationBody;
  }

  /**
   * Canonicalizes a model property with the supplied visibility.
   */
  #canonicalizeModelProperty(
    property: ModelProperty,
    visibility: Visibility,
    contentType?: string,
  ): ModelPropertyHttpCanonicalization {
    return this.engine.canonicalize(
      property,
      new HttpCanonicalizationOptions({ visibility, contentType }),
    );
  }

  /**
   * Exhaustiveness guard for impossible code paths.
   */
  #assertNever(value: never): never {
    throw new Error("Unhandled HTTP payload body kind.");
  }
}
