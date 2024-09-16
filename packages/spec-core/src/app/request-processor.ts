import {
  MockRequest,
  MockRequestHandler,
  MockResponse,
  RequestExt,
  ValidationError,
} from "@typespec/spec-api";
import { Response } from "express";
import { inspect } from "util";
import { CoverageTracker } from "../coverage/coverage-tracker.js";
import { logger } from "../logger.js";

export async function processRequest(
  coverageTracker: CoverageTracker,
  scenarioName: string,
  scenarioUri: string,
  request: RequestExt,
  response: Response,
  func: MockRequestHandler,
): Promise<void> {
  const mockRequest = new MockRequest(request);
  const mockResponse = await callHandler(mockRequest, response, func);
  if (mockResponse === undefined) {
    return;
  }

  await coverageTracker.trackEndpointResponse(scenarioName, scenarioUri, mockResponse);
  processResponse(response, mockResponse);
}

const processResponse = (response: Response, mockResponse: MockResponse) => {
  response.status(mockResponse.status);

  if (mockResponse.headers) {
    response.set(mockResponse.headers);
  }

  if (mockResponse.body) {
    response.contentType(mockResponse.body.contentType).send(mockResponse.body.rawContent);
  }

  response.end();
};

const callHandler = async (
  mockRequest: MockRequest,
  response: Response,
  func: MockRequestHandler,
): Promise<MockResponse | undefined> => {
  try {
    return func(mockRequest);
  } catch (e) {
    if (!(e instanceof ValidationError)) {
      throw e;
    }

    logger.warn(
      [
        `Request validation failed: ${e.message}:`,
        ` Expected:\n${inspect(e.expected)}`,
        ` Actual: \n${inspect(e.actual)}`,
      ].join("\n"),
    );
    response
      .status(400)
      .contentType("application/json")
      .send(e.toJSON ? e.toJSON() : JSON.stringify(e.message))
      .end();
    return undefined;
  }
};
