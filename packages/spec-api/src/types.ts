import type { Request } from "express";
import type { MockRequest } from "./mock-request.js";

/**
 * Express request augmented by the mock server's body and multipart middleware.
 */
export interface RequestExt extends Request {
  /** Unparsed payload captured before body parsing; absent when no raw body was captured. */
  rawBody?: string | Buffer;
  /** Uploaded files, grouped by field name or returned as a flat list by the upload middleware. */
  files?:
    | {
        /** All uploaded files associated with this form field. */
        [fieldname: string]: Express.Multer.File[];
      }
    | Express.Multer.File[]
    | undefined;
}

/** Status-based coverage policies; key-based scenarios use {@link PassByKeyScenario} instead. */
export type ScenarioPassCondition = "response-success" | "status-code";

/** Scenario whose latest recorded response for each endpoint URI must have a 2xx status. */
export interface PassOnSuccessScenario {
  /** Selects coverage evaluation by successful HTTP status. */
  passCondition: "response-success";
  /** Endpoints to register and exercise before the scenario can pass. */
  apis: MockApiDefinition[];
}

/** Scenario whose latest recorded response for each endpoint URI must have a specified status. */
export interface PassOnCodeScenario {
  /** Selects coverage evaluation by an exact HTTP status. */
  passCondition: "status-code";
  /** Required response status, including non-2xx codes for error scenarios. */
  code: number;
  /** Endpoints to register and exercise before the scenario can pass. */
  apis: MockApiDefinition[];
}
/** Scenario that records handler-selected pass keys rather than judging HTTP status codes. */
export interface PassByKeyScenario<K extends string = string> {
  /** Selects coverage evaluation from {@link KeyedMockResponse.pass}. */
  passCondition: "by-key";
  /** Required keys in the evaluated responses; {@link Fail} marks a failure. */
  keys: K[];
  /**
   * Endpoints registered for the scenario. Current coverage limitation: only the first
   * endpoint's recorded responses are evaluated; keys from later endpoints are not combined.
   * For now, avoid distributing required keys across endpoints.
   */
  apis: KeyedMockApiDefinition<K>[];
}

/** Mock endpoints and the policy used to evaluate their scenario coverage. */
export type ScenarioMockApi = PassOnSuccessScenario | PassOnCodeScenario | PassByKeyScenario;
/** Handler that returns either a status-based response or a response carrying a coverage key. */
export type MockRequestHandler = SimpleMockRequestHandler | KeyedMockRequestHandler;
/** Validates an incoming request and returns its response, synchronously or asynchronously. */
export type SimpleMockRequestHandler = (req: MockRequest) => MockResponse | Promise<MockResponse>;
/** Validates an incoming request and returns a response with a pass key or {@link Fail}. */
export type KeyedMockRequestHandler<T extends string = string> = (
  req: MockRequest,
) => KeyedMockResponse<T> | Promise<KeyedMockResponse<T>>;
export type KeyedServiceRequestHandler<T extends string = string> = (
  req: ServiceRequest,
) => KeyedMockResponse<T> | Promise<KeyedMockResponse<T>>;

/** Lowercase HTTP methods supported when registering mock endpoints. */
export type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "head" | "options";

/** An endpoint's route, declarative request expectations and default response or custom handler. */
export interface MockApiDefinition {
  /** Express route pattern, which can contain named path parameters such as `:id`. */
  uri: string;
  /** HTTP method registered for this route. */
  method: HttpMethod;
  /**
   * Inputs used to generate service calls and, without a custom handler, validate body,
   * headers and query parameters. Omitted expectations do not enforce absence.
   */
  request?: ServiceRequest;
  /** Response returned by the generated handler and expected by mock API self-tests. */
  response: MockResponse;
  /** Overrides generated request validation and response selection when supplied. */
  handler?: MockRequestHandler;
  /** Discriminator identifying an endpoint definition. */
  kind: "MockApiDefinition";
}

/** File input used to construct a multipart service request. */
export interface ServiceRequestFile {
  /** Multipart form field that carries this file. */
  fieldname: string;
  /** Filename sent in the part's Content-Disposition header. */
  originalname: string;
  /** File bytes sent without text conversion. */
  buffer: Buffer;
  /** Media type assigned to the file part. */
  mimetype: string;
}

/** Declarative inputs shared by generated mock handlers and mock API service-call tests. */
export interface ServiceRequest {
  /**
   * Expected request payload. JSON and XML are compared structurally; Buffer payloads
   * are compared byte-for-byte. Multipart validation requires a custom handler.
   */
  body?: MockBody | MockMultipartBody;
  /**
   * Ignored by built-in request validation and service-call generation.
   * The mock response status is configured through {@link MockResponse.status}, not this field.
   */
  status?: number;
  /**
   * Expected query entries; extra query parameters are allowed. Dynamic values and
   * matchers are supported, and arrays are compared in order.
   */
  query?: Record<string, unknown>;
  /**
   * Values substituted into named route parameters when generating service calls.
   * The default mock handler does not validate them.
   */
  pathParams?: Record<string, unknown>;
  /**
   * Expected header entries; extra headers are allowed. Use lowercase names for
   * parsed request headers. The default handler skips Content-Type validation.
   */
  headers?: Record<string, unknown>;
  /**
   * Ignored by built-in request validation and service-call generation.
   * Supply multipart file inputs through {@link MockMultipartBody.files} on body instead,
   * and validate incoming uploads in a custom handler.
   */
  files?: ServiceRequestFile[];
}

/** Explicit failure marker for a keyed scenario, independent of the HTTP response status. */
export const Fail = Symbol.for("Fail");
/** Endpoint whose custom handler reports which coverage key a request satisfies. */
export interface KeyedMockApiDefinition<K extends string> extends MockApiDefinition {
  /** Validates the request and selects a pass key or {@link Fail} for the response. */
  handler: KeyedMockRequestHandler<K>;
}

/** HTTP response returned by a mock request handler. */
export interface MockResponse {
  /** HTTP status sent to the client and used by status-based scenario coverage. */
  status: number;
  /** Response header values; dynamic values are expanded before sending. */
  headers?: {
    /** Value passed to Express for this response header. */
    [key: string]: unknown | null;
  };

  /** Optional payload and its media type; omit for a response without a body. */
  body?: MockBody;

  /**
   * Optional success annotation. The built-in coverage tracker currently evaluates
   * status codes or pass keys and does not read this annotation.
   */
  testSuccessful?: boolean;
}

/** HTTP response that also records a keyed scenario outcome. */
export interface KeyedMockResponse<K extends string = string> extends MockResponse {
  /** Coverage key satisfied by this request, or {@link Fail} to explicitly fail it. */
  pass: K | typeof Fail;
}

/** Encoded payload shared by request expectations and mock responses. */
export interface MockBody {
  /** Media type sent with a response and used to select request-body comparison. */
  contentType: string;
  /**
   * Encoded text, raw bytes or content resolved at request time. {@link Resolver.serialize}
   * produces wire text; {@link Resolver.resolve} produces a format-specific comparison value.
   * JSON resolvers retain structured matcher objects. XML template validation instead
   * collects matchers separately from the serialized XML.
   */
  rawContent: string | Buffer | Resolver | undefined;
  /** Buffers written in order for a streamed response, taking precedence over rawContent. */
  streamChunks?: Buffer[];
}

/** Request-time context for expanding dynamic payloads and local URLs. */
export interface ResolverConfig {
  /** Server origin, including protocol, host and port, used to construct absolute URLs. */
  baseUrl: string;
}

/** Deferred content with separate wire serialization and format-specific comparison values. */
export interface Resolver {
  /** Expands dynamic content for the server context and produces the text sent on the wire. */
  serialize(config: ResolverConfig): string;
  /**
   * Expands content for comparison. JSON resolvers preserve matcher objects in structured
   * values; dyn and XML template resolvers return strings with matchers serialized.
   * XML validation recovers template matchers separately through getMatchers.
   */
  resolve(config: ResolverConfig): unknown;
}

/** Multipart request input for service-call generation; validate incoming parts in a custom handler. */
export interface MockMultipartBody {
  /** Discriminator distinguishing multipart inputs from {@link MockBody}. */
  kind: "multipart";
  /** Multipart media type; the `multipart()` helper defaults to `multipart/form-data`. */
  contentType: `multipart/${string}`;
  /** Named non-file parts; the service-call generator JSON-stringifies each value. */
  parts?: Record<string, unknown>;
  /** File parts with their field names, filenames, bytes and media types. */
  files?: ServiceRequestFile[];
}

/**
 * Query-array encoding: repeated parameters (`multi`), or comma, space, tab or pipe
 * delimiters (`csv`, `ssv`, `tsv`, `pipes`). Element order is significant during validation.
 */
export type CollectionFormat = "multi" | "csv" | "ssv" | "tsv" | "pipes";
