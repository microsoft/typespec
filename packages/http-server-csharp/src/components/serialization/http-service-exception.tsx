import { code, type Children } from "@alloy-js/core";
import { Namespace } from "@alloy-js/csharp";
import { CSharpFile } from "../csharp-file.jsx";

/**
 * Renders the framework-neutral HttpServiceException base class used by error models.
 */
export function HttpServiceException(): Children {
  return (
    <CSharpFile path="HttpServiceException.cs" using={["System", "System.Collections.Generic"]}>
      <Namespace name="TypeSpec.Helpers">
        {code`
          /// <summary>
          /// Represents an HTTP response exception with a status code and optional value.
          /// </summary>
          public class HttpServiceException : Exception
          {
            /// <summary>
            /// Initializes a new instance of the HttpServiceException class.
            /// </summary>
            /// <param name="statusCode">The HTTP status code.</param>
            /// <param name="value">The optional value to include in the response.</param>
            public HttpServiceException(int statusCode, object? value = null, Dictionary<string, string>? headers = null) =>
              (StatusCode, Value, Headers) = (statusCode, value, headers ?? new Dictionary<string, string>());

            public int StatusCode { get; }

            public object? Value { get; }

            public Dictionary<string, string> Headers { get; }
          }
        `}
      </Namespace>
    </CSharpFile>
  );
}
