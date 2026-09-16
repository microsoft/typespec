import { code, type Children } from "@alloy-js/core";
import { Namespace } from "@alloy-js/csharp";
import { CSharpFile } from "../csharp-file.jsx";

/**
 * Renders the ASP.NET action filter that converts HttpServiceException instances to HTTP responses.
 */
export function HttpServiceExceptionFilter(): Children {
  return (
    <CSharpFile
      path="HttpServiceExceptionFilter.cs"
      using={["Microsoft.AspNetCore.Mvc", "Microsoft.AspNetCore.Mvc.Filters"]}
    >
      <Namespace name="TypeSpec.Helpers">
        {code`
          /// <summary>
          /// An action filter that handles HttpServiceException and converts it to an HTTP response.
          /// </summary>
          public class HttpServiceExceptionFilter : IActionFilter, IOrderedFilter
          {
            public int Order => int.MaxValue - 10;

            public void OnActionExecuting(ActionExecutingContext context) { }

            public void OnActionExecuted(ActionExecutedContext context)
            {
              if (context.Exception is HttpServiceException httpServiceException)
              {
                foreach (var header in httpServiceException.Headers)
                {
                  context.HttpContext.Response.Headers.Append(header.Key, header.Value.ToString());
                }

                context.Result = new ObjectResult(httpServiceException.Value)
                {
                  StatusCode = httpServiceException.StatusCode,
                };

                context.ExceptionHandled = true;
              }
            }
          }
        `}
      </Namespace>
    </CSharpFile>
  );
}
