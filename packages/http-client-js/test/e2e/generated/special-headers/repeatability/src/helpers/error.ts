import { PipelineRequest, HttpResponse, RawHttpHeaders } from "@typespec/ts-http-runtime";

export class RestError extends Error {
  public request: PipelineRequest;
  public response: HttpResponse;
  public status: string;
  public body: any;
  public headers: RawHttpHeaders;constructor(
    message: string,
    response: HttpResponse,) {
    // Create an error message that includes relevant details.
    super(`${message} - HTTP ${response.status} received for ${response.request.method} ${response.request.url}`);
    this.name = 'RestError';
    this.request = response.request;
    this.response = response;
    this.status = response.status;
    this.headers = response.headers;
    this.body = response.body;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, RestError.prototype);
  }
  static fromHttpResponse(response: HttpResponse): RestError {
    const defaultMessage = `Unexpected HTTP status code: ${response.status}`;
    return new RestError(defaultMessage, response);
  }
}

export function createRestError(response: HttpResponse): RestError {
  return RestError.fromHttpResponse(response);
}