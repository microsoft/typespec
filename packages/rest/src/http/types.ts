import {
  Interface,
  ListOperationOptions,
  ModelProperty,
  Namespace,
  Operation,
  Type,
} from "@cadl-lang/compiler";

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
  | Oauth2Auth<OAuth2Flow[]>;

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

export type OperationContainer = Namespace | Interface;

export interface FilteredRouteParam {
  routeParamString?: string;
  excludeFromOperationParams?: boolean;
}

export interface AutoRouteOptions {
  routeParamFilter?: (op: Operation, param: ModelProperty) => FilteredRouteParam | undefined;
}

export interface RouteOptions {
  autoRouteOptions?: AutoRouteOptions;
}

export interface RouteResolutionOptions extends RouteOptions {
  listOptions?: ListOperationOptions;
}

export interface HttpOperationParameter {
  type: "query" | "path" | "header";
  name: string;
  param: ModelProperty;
}

export interface HttpOperationParameters {
  parameters: HttpOperationParameter[];
  bodyType?: Type;
  bodyParameter?: ModelProperty;
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
}

export interface RoutePath {
  path: string;
  isReset: boolean;
}

export type StatusCode = `${number}` | "*";
export interface HttpOperationResponse {
  statusCode: StatusCode;
  type: Type;
  description?: string;
  responses: HttpOperationResponseContent[];
}

export interface HttpOperationResponseContent {
  headers?: Record<string, ModelProperty>;
  body?: HttpOperationBody;
}

export interface HttpOperationBody {
  contentTypes: string[];
  type: Type;
}
