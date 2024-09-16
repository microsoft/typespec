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
  apis: MockApi[];
}

export interface PassOnCodeScenario {
  passCondition: "status-code";
  code: number;
  apis: MockApi[];
}
export interface PassByKeyScenario<K extends string = string> {
  passCondition: "by-key";
  keys: K[];
  apis: KeyedMockApi<K>[];
}

export type ScenarioMockApi = PassOnSuccessScenario | PassOnCodeScenario | PassByKeyScenario;
export type MockRequestHandler = SimpleMockRequestHandler | KeyedMockRequestHandler;
export type SimpleMockRequestHandler = (req: MockRequest) => MockResponse | Promise<MockResponse>;
export type KeyedMockRequestHandler<T extends string = string> = (
  req: MockRequest,
) => KeyedMockResponse<T> | Promise<KeyedMockResponse<T>>;

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "head" | "options";

export type MockApiForHandler<Handler extends MockRequestHandler> =
  Handler extends KeyedMockRequestHandler<infer K> ? KeyedMockApi<K> : MockApi;

export interface MockApi {
  method: HttpMethod;
  uri: string;
  handler: MockRequestHandler;
}

export const Fail = Symbol.for("Fail");
export interface KeyedMockApi<K extends string> extends MockApi {
  handler: KeyedMockRequestHandler<K>;
}

export interface MockResponse {
  status: number;
  headers?: {
    [key: string]: string | null;
  };

  body?: MockResponseBody;

  /**
   * Let the mock API know that this request was successful to counting coverage regardless of the status code.
   * By default only 2xx status code will count toward success.
   */
  testSuccessful?: boolean;
}

export interface KeyedMockResponse<K extends string = string> extends MockResponse {
  pass: K | typeof Fail;
}

export interface MockResponseBody {
  contentType: string;
  rawContent: string | Buffer | undefined;
}

export type CollectionFormat = "multi" | "csv" | "ssv" | "tsv" | "pipes";
