import type { HttpStatusCodesEntry, HttpVerb } from "@typespec/http";

/**
 * Maps an HTTP verb to its ASP.NET Core attribute library reference.
 */
export function getHttpVerbAttribute(verb: HttpVerb): string {
  switch (verb) {
    case "delete":
      return "HttpDelete";
    case "get":
      return "HttpGet";
    case "patch":
      return "HttpPatch";
    case "post":
      return "HttpPost";
    case "put":
      return "HttpPut";
    case "head":
      return "HttpHead";
    default:
      return "HttpGet";
  }
}

/**
 * Maps an HTTP status code to its ASP.NET Core `HttpStatusCode` enum member.
 */
export function getCSharpStatusCode(entry: HttpStatusCodesEntry): string | undefined {
  switch (entry) {
    case 200:
      return "HttpStatusCode.OK";
    case 201:
      return "HttpStatusCode.Created";
    case 202:
      return "HttpStatusCode.Accepted";
    case 204:
      return "HttpStatusCode.NoContent";
    default:
      return undefined;
  }
}

/**
 * Returns the ASP.NET Core controller return statement for a given HTTP status code.
 */
export function getControllerReturnStatement(
  status: HttpStatusCodesEntry,
  hasValue: boolean,
): string {
  if (typeof status === "number") {
    switch (status) {
      case 200:
        return hasValue ? "return Ok(result);" : "return Ok();";
      case 201:
        return hasValue ? `return Created("", result);` : `return Created("", null);`;
      case 202:
        return hasValue ? "return Accepted(result);" : "return Accepted();";
      case 204:
        return "return NoContent();";
      default:
        return hasValue ? `return StatusCode(${status}, result);` : `return StatusCode(${status});`;
    }
  }
  return hasValue ? "return Ok(result);" : "return Ok();";
}

/**
 * Extracts the route template from an HTTP operation path.
 */
export function getRouteTemplate(path: string): string {
  return path;
}
