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
} from "@typespec/mutator-framework";
import type {
  HttpCanonicalization,
  HttpCanonicalizationMutations,
} from "./http-canonicalization-classes.js";
import type { HttpCanonicalizationInfo, HttpCanonicalizer } from "./http-canonicalization.js";
import type { ModelPropertyHttpCanonicalization } from "./model-property.js";
import type { ModelHttpCanonicalization } from "./model.js";
import { HttpCanonicalizationOptions } from "./options.js";
import type { ScalarHttpCanonicalization } from "./scalar.js";

export interface CanonicalHeaderParameterOptions {
  type: "header";
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

export interface CanonicalCookieParameterOptions {
  type: "cookie";
  name: string;
}

export interface CanonicalQueryParameterOptions {
  readonly name: string;
  readonly explode: boolean;
}

export interface CanonicalPathParameterOptions {
  readonly name: string;
  readonly explode: boolean;
  readonly style: "simple" | "label" | "matrix" | "fragment" | "path";
  readonly allowReserved: boolean;
}

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

export interface CanonicalHttpPropertyBase {
  readonly property: ModelPropertyHttpCanonicalization;
  /** Path from the root of the operation parameters/returnType to the property. */
  readonly path: (string | number)[];
}
export interface CanonicalHeaderProperty extends CanonicalHttpPropertyBase {
  readonly kind: "header";
  readonly options: CanonicalHeaderParameterOptions;
}
export interface CanonicalCookieProperty extends CanonicalHttpPropertyBase {
  readonly kind: "cookie";
  readonly options: CanonicalCookieParameterOptions;
}
export interface CanonicalContentTypeProperty extends CanonicalHttpPropertyBase {
  readonly kind: "contentType";
}

export interface CanonicalQueryProperty extends CanonicalHttpPropertyBase {
  readonly kind: "query";
  readonly options: CanonicalQueryParameterOptions;
}

export interface CanonicalPathProperty extends CanonicalHttpPropertyBase {
  readonly kind: "path";
  readonly options: CanonicalPathParameterOptions;
}

export interface CanonicalStatusCodeProperty extends CanonicalHttpPropertyBase {
  readonly kind: "statusCode";
}
export interface CanonicalBodyProperty extends CanonicalHttpPropertyBase {
  readonly kind: "body";
}
export interface CanonicalBodyRootProperty extends CanonicalHttpPropertyBase {
  readonly kind: "bodyRoot";
}
export interface CanonicalMultipartBodyProperty extends CanonicalHttpPropertyBase {
  readonly kind: "multipartBody";
}
/** Property to include inside the body */
export interface CanonicalBodyPropertyProperty extends CanonicalHttpPropertyBase {
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

interface CanonicalHttpOperationParameters {
  body?: CanonicalHttpPayloadBody;
  properties: CanonicalHttpProperty[];
}

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

export interface CanonicalHttpOperationResponseContent {
  /** Canonical HTTP properties for this response */
  readonly properties: CanonicalHttpProperty[];
  readonly headers?: Record<string, ModelPropertyHttpCanonicalization>;
  readonly body?: CanonicalHttpPayloadBody;
}

export type CanonicalHttpPayloadBody =
  | CanonicalHttpOperationBody
  | CanonicalHttpOperationMultipartBody
  | CanonicalHttpOperationFileBody;

export interface CanonicalHttpOperationBodyBase {
  /** Content types. */
  readonly contentTypes: string[];
  /** Property used to set the content type if exists */
  readonly contentTypeProperty?: ModelPropertyHttpCanonicalization;
  /**
   * The payload property that defined this body, if any.
   */
  readonly property?: ModelPropertyHttpCanonicalization;
}

export interface CanonicalHttpBody {
  readonly type: HttpCanonicalization;
  /** If the body was explicitly set with `@body`. */
  readonly isExplicit: boolean;
  /** If the body contains metadata annotations to ignore. */
  readonly containsMetadataAnnotations: boolean;
}

export interface CanonicalHttpOperationBody
  extends CanonicalHttpOperationBodyBase,
    CanonicalHttpBody {
  readonly bodyKind: "single";
}

export type CanonicalHttpOperationMultipartBody =
  | CanonicalHttpOperationMultipartBodyModel
  | CanonicalHttpOperationMultipartBodyTuple;

export interface CanonicalHttpOperationMultipartBodyCommon extends CanonicalHttpOperationBodyBase {
  readonly bodyKind: "multipart";
  /** Property annotated with `@multipartBody` */
  readonly property: ModelPropertyHttpCanonicalization;
  readonly parts: CanonicalHttpOperationPart[];
}

export interface CanonicalHttpOperationMultipartBodyModel
  extends CanonicalHttpOperationMultipartBodyCommon {
  readonly multipartKind: "model";
  readonly type: ModelHttpCanonicalization;
  readonly parts: CanonicalHttpOperationModelPart[];
}

export interface CanonicalHttpOperationMultipartBodyTuple
  extends CanonicalHttpOperationMultipartBodyCommon {
  readonly multipartKind: "tuple";
  readonly type: HttpCanonicalization;
  readonly parts: CanonicalHttpOperationTuplePart[];
}

export type CanonicalHttpOperationMultipartPartBody =
  | CanonicalHttpOperationBody
  | CanonicalHttpOperationFileBody;

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

export type CanonicalHttpOperationPart =
  | CanonicalHttpOperationModelPart
  | CanonicalHttpOperationTuplePart;

export interface CanonicalHttpOperationModelPart extends CanonicalHttpOperationPartCommon {
  readonly partKind: "model";
  /** Property that defined the part if the model form is used. */
  readonly property: ModelPropertyHttpCanonicalization;
  /** Part name */
  readonly name: string;
}

export interface CanonicalHttpOperationTuplePart extends CanonicalHttpOperationPartCommon {
  readonly partKind: "tuple";
  /** Property that defined the part -- always undefined for tuple entry parts. */
  readonly property?: undefined;
}

export interface CanonicalHttpOperationFileBody extends CanonicalHttpOperationBodyBase {
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
    readonly type: ScalarHttpCanonicalization;
  };
}

/**
 * Canonicalizes operations by deriving HTTP-specific request and response shapes.
 */
export class OperationHttpCanonicalization extends OperationMutation<
  HttpCanonicalizationOptions,
  HttpCanonicalizationMutations,
  HttpCanonicalizer
> {
  /**
   * Cached HTTP metadata for this operation.
   */
  #httpOperationInfo: HttpOperation;
  /**
   * Indicates if the operation corresponds to a named declaration. Always true.
   */
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

  static mutationInfo(
    engine: HttpCanonicalizer,
    sourceType: Operation,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ): HttpCanonicalizationInfo {
    return {
      mutationKey: options.mutationKey,
      codec: null as any, // Operations don't need a codec
    };
  }

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
    return new MutationHalfEdge(this, (tail) => {
      this.#languageMutationNode.connectParameters(tail.languageMutationNode);
      this.#wireMutationNode.connectParameters(tail.wireMutationNode);
    });
  }

  protected startReturnTypeEdge(): MutationHalfEdge {
    return new MutationHalfEdge(this, (tail) => {
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
        this.#canonicalizeHttpProperty(param, this.parameterVisibility),
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
        this.#canonicalizeHttpProperty(property, this.returnTypeVisibility),
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
  ): CanonicalHttpProperty {
    const canonicalProperty = this.#canonicalizeModelProperty(property.property, visibility);

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
          property: body.property
            ? this.#canonicalizeModelProperty(body.property, visibility)
            : undefined,
          type: this.engine.canonicalize(body.type, {
            visibility,
            contentType: body.contentTypes[0],
          }) as HttpCanonicalization,
          isExplicit: body.isExplicit,
          containsMetadataAnnotations: body.containsMetadataAnnotations,
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
  ): ModelPropertyHttpCanonicalization {
    return this.engine.canonicalize(property, new HttpCanonicalizationOptions({ visibility }));
  }

  /**
   * Exhaustiveness guard for impossible code paths.
   */
  #assertNever(value: never): never {
    throw new Error("Unhandled HTTP payload body kind.");
  }
}
