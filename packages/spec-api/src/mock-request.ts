import { RequestExpectation } from "./expectation.js";
import type { RequestExt } from "./types.js";

/** Handler-facing view of an Express request, with assertion helpers and parsed request data. */
export class MockRequest {
  /** Assertions bound to the original request; failed assertions throw ValidationError. */
  public readonly expect: RequestExpectation;

  /** Incoming request origin (`protocol://host`), including the port when present. */
  public readonly baseUrl: string;
  /** Parsed headers using Express/Node's lowercase names; values are not copied or normalized here. */
  public readonly headers: {
    /** Header value retained from the original request, without additional conversion. */
    [key: string]: string;
  };
  /** Values returned by Express's query parser, including arrays for repeated parameters. */
  public readonly query: {
    /** One query value, or the ordered values of a repeated parameter. */
    [key: string]: string | string[];
  };
  /** Named route parameters extracted by Express, shared with the original request. */
  public readonly params: {
    /** Route segment captured for a named parameter such as `:id`. */
    [key: string]: string;
  };
  /** Payload produced by the server's body parser, not the raw wire bytes. */
  public readonly body: any;
  /** Multipart uploads as provided by the upload middleware; absent when no files were parsed. */
  public readonly files?:
    | {
        /** Uploaded files associated with this form field, in middleware order. */
        [fieldname: string]: Express.Multer.File[];
      }
    | Express.Multer.File[]
    | undefined;

  /** Wraps a request without cloning its parsed data and binds assertions to that same request. */
  public constructor(
    /** Underlying Express request, including rawBody for byte- or text-level assertions. */
    public originalRequest: RequestExt,
  ) {
    this.baseUrl = getRequestBaseUrl(originalRequest);
    this.expect = new RequestExpectation(originalRequest);
    this.headers = originalRequest.headers as { [key: string]: string };
    this.query = originalRequest.query as { [key: string]: string };
    this.params = originalRequest.params as { [key: string]: string };
    this.body = originalRequest.body;
    this.files = originalRequest.files;
  }
}

const getRequestBaseUrl = (request: RequestExt): string =>
  `${request.protocol}://${request.get("host")}`;
