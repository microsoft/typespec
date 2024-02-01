import {
  DiagnosticResult,
  Interface,
  ListOperationOptions,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Type,
} from "@typespec/compiler";

/**
 * @deprecated use `HttpOperation`. To remove in November 2022 release.
 */
export type OperationDetails = HttpOperation;

export type HttpVerb = "get" | "put" | "post" | "patch" | "delete" | "head";

export interface ServiceAuthentication {
  /**
   * Either one of those options can be used independently to authenticate.
   */
  options: AuthenticationOption[];
}

export interface AuthenticationOption {
  /**
   * For this authentication option all the given auth have to be used together.
   */
  schemes: HttpAuth[];
}

export type HttpAuth =
  | BasicAuth
  | BearerAuth
  | ApiKeyAuth<ApiKeyLocation, string>
  | Oauth2Auth<OAuth2Flow[]>
  | OpenIDConnectAuth;

export interface HttpAuthBase {
  /**
   * Id of the authentication scheme.
   */
  id: string;

  /**
   * Optional description.
   */
  description?: string;
}

/**
 * Basic authentication is a simple authentication scheme built into the HTTP protocol.
 * The client sends HTTP requests with the Authorization header that contains the word Basic word followed by a space and a base64-encoded string username:password.
 * For example, to authorize as demo / p@55w0rd the client would send
 * ```
 *  Authorization: Basic ZGVtbzpwQDU1dzByZA==
 * ```
 */
export interface BasicAuth extends HttpAuthBase {
  type: "http";
  scheme: "basic";
}

/**
 * Bearer authentication (also called token authentication) is an HTTP authentication scheme that involves security tokens called bearer tokens.
 * The name “Bearer authentication” can be understood as “give access to the bearer of this token.” The bearer token is a cryptic string, usually generated by the server in response to a login request.
 * The client must send this token in the Authorization header when making requests to protected resources:
 * ```
 *   Authorization: Bearer <token>
 * ```
 */
export interface BearerAuth extends HttpAuthBase {
  type: "http";
  scheme: "bearer";
}

type ApiKeyLocation = "header" | "query" | "cookie";

/**
 * An API key is a token that a client provides when making API calls. The key can be sent in the query string:
 * ```
 * GET /something?api_key=abcdef12345
 * ```
 *
 * or as a request header
 *
 * ```
 * GET /something HTTP/1.1
 * X-API-Key: abcdef12345
 * ```
 *
 * or as a cookie
 *
 * ```
 * GET /something HTTP/1.1
 * Cookie: X-API-KEY=abcdef12345
 * ```
 */
export interface ApiKeyAuth<TLocation extends ApiKeyLocation, TName extends string>
  extends HttpAuthBase {
  type: "apiKey";
  in: TLocation;
  name: TName;
}

/**
 * OAuth 2.0 is an authorization protocol that gives an API client limited access to user data on a web server.
 * OAuth relies on authentication scenarios called flows, which allow the resource owner (user) to share the protected content from the resource server without sharing their credentials.
 * For that purpose, an OAuth 2.0 server issues access tokens that the client applications can use to access protected resources on behalf of the resource owner.
 * For more information about OAuth 2.0, see oauth.net and RFC 6749.
 */
export interface Oauth2Auth<TFlows extends OAuth2Flow[]> extends HttpAuthBase {
  type: "oauth2";
  flows: TFlows;
}

export type OAuth2Flow =
  | AuthorizationCodeFlow
  | ImplicitFlow
  | PasswordFlow
  | ClientCredentialsFlow;

export type OAuth2FlowType = OAuth2Flow["type"];

/**
 * Authorization Code flow
 */
export interface AuthorizationCodeFlow {
  type: "authorizationCode";
  authorizationUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
  scopes: OAuth2Scope[];
}

/**
 * Implicit flow
 */
export interface ImplicitFlow {
  type: "implicit";
  authorizationUrl: string;
  refreshUrl?: string;
  scopes: OAuth2Scope[];
}

/**
 * Resource Owner Password flow
 */
export interface PasswordFlow {
  type: "password";
  authorizationUrl: string;
  refreshUrl?: string;
  scopes: OAuth2Scope[];
}

/**
 * Client credentials flow
 */
export interface ClientCredentialsFlow {
  type: "clientCredentials";
  tokenUrl: string;
  refreshUrl?: string;
  scopes: OAuth2Scope[];
}

export interface OAuth2Scope {
  value: string;
  description?: string;
}

/**
 * OpenID Connect (OIDC) is an identity layer built on top of the OAuth 2.0 protocol and supported by some OAuth 2.0 providers, such as Google and Azure Active Directory.
 * It defines a sign-in flow that enables a client application to authenticate a user, and to obtain information (or "claims") about that user, such as the user name, email, and so on.
 * User identity information is encoded in a secure JSON Web Token (JWT), called ID token.
 * OpenID Connect defines a discovery mechanism, called OpenID Connect Discovery, where an OpenID server publishes its metadata at a well-known URL, typically
 */
export interface OpenIDConnectAuth extends HttpAuthBase {
  type: "openIdConnect";
  openIdConnectUrl: string;
}

export type OperationContainer = Namespace | Interface;

export type OperationVerbSelector = (
  program: Program,
  operation: Operation
) => HttpVerb | undefined;

export interface OperationParameterOptions {
  verbSelector?: OperationVerbSelector;
}

export interface RouteOptions {
  // Other options can be passed through the interface
  [prop: string]: any;

  paramOptions?: OperationParameterOptions;
}

export interface RouteResolutionOptions extends RouteOptions {
  listOptions?: ListOperationOptions;
}

export interface RouteProducerResult {
  segments: string[];
  parameters: HttpOperationParameters;
}

export type RouteProducer = (
  program: Program,
  operation: Operation,
  parentSegments: string[],
  overloadBase: HttpOperation | undefined,
  options: RouteOptions
) => DiagnosticResult<RouteProducerResult>;

export interface HeaderFieldOptions {
  type: "header";
  name: string;
  /**
   * The string format of the array. "csv" and "simple" are used interchangeably, as are
   * "multi" and "form".
   */
  format?: "csv" | "multi" | "ssv" | "tsv" | "pipes" | "simple" | "form";
}

export interface QueryParameterOptions {
  type: "query";
  name: string;
  /**
   * The string format of the array. "csv" and "simple" are used interchangeably, as are
   * "multi" and "form".
   */
  format?: "multi" | "csv" | "ssv" | "tsv" | "pipes" | "simple" | "form";
}

export interface PathParameterOptions {
  type: "path";
  name: string;
}

export type HttpOperationParameter = (
  | HeaderFieldOptions
  | QueryParameterOptions
  | PathParameterOptions
) & {
  param: ModelProperty;
};

/**
 * Represent the body information for an http request.
 *
 * @note the `type` must be a `Model` if the content type is multipart.
 */
export interface HttpOperationRequestBody extends HttpOperationBody {
  /**
   * If the body was explicitly set as a property. Correspond to the property with `@body`
   */
  parameter?: ModelProperty;
}

export interface HttpOperationParameters {
  parameters: HttpOperationParameter[];

  body?: HttpOperationRequestBody;

  /** @deprecated use {@link body.type} */
  bodyType?: Type;
  /** @deprecated use {@link body.parameter} */
  bodyParameter?: ModelProperty;

  /**
   * @internal
   * NOTE: The verb is determined when processing parameters as it can
   * depend on whether there is a request body if not explicitly specified.
   * Marked internal to keep from polluting the public API with the verb at
   * two levels.
   */
  verb: HttpVerb;
}

export interface HttpService {
  namespace: Namespace;
  operations: HttpOperation[];
}

export interface HttpOperation {
  /**
   * Route path
   */
  path: string;

  /**
   * Path segments
   */
  pathSegments: string[];

  /**
   * Route verb.
   */
  verb: HttpVerb;

  /**
   * Parent type being the interface, namespace or global namespace.
   */
  container: OperationContainer;

  /**
   * Parameters.
   */
  parameters: HttpOperationParameters;

  /**
   * Responses.
   */
  responses: HttpOperationResponse[];

  /**
   * Operation type reference.
   */
  operation: Operation;

  /**
   * Overload this operation
   */
  overloading?: HttpOperation;

  /**
   * List of operations that overloads this one.
   */
  overloads?: HttpOperation[];
}

export interface RoutePath {
  path: string;
  shared: boolean;
}

export interface HttpOperationResponse {
  /** @deprecated use {@link statusCodes} */
  // eslint-disable-next-line deprecation/deprecation
  statusCode: StatusCode;

  /**
   * Status code or range of status code for the response.
   */
  statusCodes: HttpStatusCodeRange | number | "*";

  /**
   * Response TypeSpec type.
   */
  type: Type;

  /**
   * Response description.
   */
  description?: string;

  /**
   * Responses contents.
   */
  responses: HttpOperationResponseContent[];
}

export interface HttpOperationResponseContent {
  headers?: Record<string, ModelProperty>;
  body?: HttpOperationBody;
}

export interface HttpOperationBody {
  /**
   * Content types.
   */
  contentTypes: string[];

  /**
   * Type of the operation body.
   */
  type: Type;
}

export interface HttpStatusCodeRange {
  start: number;
  end: number;
}

/**
 * @deprecated Use `HttpStatusCodesEntry` instead.
 */
export type StatusCode = `${number}` | "*";

export type HttpStatusCodesEntry = HttpStatusCodeRange | number | "*";
export type HttpStatusCodes = HttpStatusCodesEntry[];
