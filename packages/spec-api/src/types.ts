import type { Request } from "express";
import { MockRequest } from "./mock-request.js";

/**
 * Extension of the express.js request which include a rawBody.
 */
export interface RequestExt extends Request {
  rawBody?: string | Buffer;
  files?:
    | {
        [fieldname: string]: Express.Multer.File[];
      }
    | Express.Multer.File[]
    | undefined;
}

export type ScenarioPassCondition = "response-success" | "status-code";

export interface PassOnSuccessScenario {
  passCondition: "response-success";
  apis: MockApiDefinition[];
}

export interface PassOnCodeScenario {
  passCondition: "status-code";
  code: number;
  apis: MockApiDefinition[];
}
export interface PassByKeyScenario<K extends string = string> {
  passCondition: "by-key";
  keys: K[];
  apis: KeyedMockApiDefinition<K>[];
}

export type ScenarioMockApi = PassOnSuccessScenario | PassOnCodeScenario | PassByKeyScenario;
export type MockRequestHandler = SimpleMockRequestHandler | KeyedMockRequestHandler;
export type SimpleMockRequestHandler = (req: MockRequest) => MockResponse | Promise<MockResponse>;
export type KeyedMockRequestHandler<T extends string = string> = (
  req: MockRequest,
) => KeyedMockResponse<T> | Promise<KeyedMockResponse<T>>;
export type KeyedServiceRequestHandler<T extends string = string> = (
  req: ServiceRequest,
) => KeyedMockResponse<T> | Promise<KeyedMockResponse<T>>;

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "head" | "options";

export interface MockApiDefinition {
  uri: string;
  method: HttpMethod;
  request?: ServiceRequest;
  response: MockResponse;
  handler?: MockRequestHandler;
  kind: "MockApiDefinition";
}

export interface ServiceRequestFile {
  fieldname: string;
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

export interface ServiceRequest {
  body?: MockBody | MockMultipartBody;
  status?: number;
  /**
   * Query parameters to match to the request.
   */
  query?: Record<string, unknown>;
  /**
   * Path parameters to match to the request.
   */
  pathParams?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  files?: ServiceRequestFile[];
}

export const Fail = Symbol.for("Fail");
export interface KeyedMockApiDefinition<K extends string> extends MockApiDefinition {
  handler: KeyedMockRequestHandler<K>;
}

export interface MockResponse {
  status: number;
  headers?: {
    [key: string]: string | null;
  };

  body?: MockBody;

  /**
   * Let the mock API know that this request was successful to counting coverage regardless of the status code.
   * By default only 2xx status code will count toward success.
   */
  testSuccessful?: boolean;
}

export interface KeyedMockResponse<K extends string = string> extends MockResponse {
  pass: K | typeof Fail;
}

export interface MockBody {
  contentType: string;
  rawContent: string | Buffer | undefined;
}
export interface MockMultipartBody {
  kind: "multipart";
  contentType: `multipart/${string}`;
  parts?: Record<string, unknown>;
  files?: ServiceRequestFile[];
}

export type CollectionFormat = "multi" | "csv" | "ssv" | "tsv" | "pipes";
