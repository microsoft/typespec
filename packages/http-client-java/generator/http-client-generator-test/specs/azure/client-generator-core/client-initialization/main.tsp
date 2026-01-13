import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using Spector;
using Azure.ClientGenerator.Core;

@doc("Test for client initialization decorator - moving parameters from method to client level")
@scenarioService("/azure/client-generator-core/client-initialization")
namespace Service;

// Common parameter types and models

model NameHeaderParam {
  @header("name")
  name: string;
}

model RegionQueryParam {
  @query
  region: string;
}

model Input {
  name: string;
}

// Scenario 1: Header parameter moved to client level

@route("/header-param")
interface HeaderParam {
  @route("/with-query")
  @get
  withQuery(...NameHeaderParam, @query id: string): void;

  @route("/with-body")
  @post
  withBody(...NameHeaderParam, @body body: Input): void;
}

// Scenario 2: Multiple parameters (header and query) moved to client level

@route("/multiple-params")
interface MultipleParams {
  @route("/with-query")
  @get
  withQuery(...NameHeaderParam, ...RegionQueryParam, @query id: string): void;

  @route("/with-body")
  @post
  withBody(...NameHeaderParam, ...RegionQueryParam, @body body: Input): void;
}

// Scenario 3: Mix of client-level and method-level parameters

@route("/mixed-params")
interface MixedParams {
  @route("/with-query")
  @get
  withQuery(...NameHeaderParam, ...RegionQueryParam, @query id: string): void;

  @route("/with-body")
  @post
  withBody(
    ...NameHeaderParam,
    ...RegionQueryParam,
    @body body: {
      name: string;
    },
  ): void;
}

// Scenario 4: Path parameter moved to client level
@doc("Blob operations with path parameter that should be moved to client level")
@route("/path")
interface PathParam {
  @route("/{blobName}/with-query")
  @get
  withQuery(@path blobName: string, @query format?: string): void;

  @route("/{blobName}/get-standalone")
  @get
  getStandalone(@path blobName: string): BlobProperties;

  @route("/{blobName}")
  @delete
  deleteStandalone(@path blobName: string): void;
}

// Scenario 5: Parameter aliases for better client API names
@doc("Operations demonstrating the @paramAlias decorator for renaming parameters in client code")
@route("/param-alias")
interface ParamAlias {
  @route("/{blob}/with-aliased-name")
  @get
  withAliasedName(
    @path
    blob: string,
  ): void;

  @route("/{blobName}/with-original-name")
  @get
  withOriginalName(
    @path
    blobName: string,
  ): void;
}

@doc("Properties of a blob")
model BlobProperties {
  name: string;
  size: int64;
  contentType: string;
  createdOn: utcDateTime;
}

// Scenario 6: Client initialization on child client
@doc("Blob operations with path parameter that should be moved to client level, in child client")
@route("/child-client")
interface ChildClient {
  @route("/{blobName}/with-query")
  @get
  withQuery(@path blobName: string, @query format?: string): void;

  @route("/{blobName}/get-standalone")
  @get
  getStandalone(@path blobName: string): BlobProperties;

  @route("/{blobName}")
  @delete
  deleteStandalone(@path blobName: string): void;
}
