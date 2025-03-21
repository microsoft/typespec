import "@typespec/http";
import "@typespec/spector";
import "@typespec/versioning";

using Http;
using Spector;
using Versioning;

/**
 * Illustrates versioned server.
 */
@service
@versioned(Versions)
@server(
  "{endpoint}",
  "Testserver endpoint",
  {
    /**
     * Need to be set as 'http://localhost:3000' in client.
     */
    endpoint: url,
  }
)
@route("/server/versions/versioned")
namespace Server.Versions.Versioned;

/**
 * The version of the API.
 */
enum Versions {
  /**
   * The version 2022-12-01-preview.
   */
  v2021_01_01_preview: "2021-01-01-preview",

  /**
   * The version 2022-12-01-preview.
   */
  v2022_12_01_preview: "2022-12-01-preview",
}

@scenario
@scenarioDoc("A simple operation without api-version. Expected url: '/without-api-version', it should not contain any api-version.")
@route("/without-api-version")
@head
op withoutApiVersion(): OkResponse;

@scenario
@scenarioDoc("A simple operation with query api-version, whose default value is defined as '2022-12-01-preview'. Expected url: '/with-query-api-version?api-version=2022-12-01-preview'.")
@route("/with-query-api-version")
@head
op withQueryApiVersion(@query("api-version") apiVersion: string): OkResponse;

@scenario
@scenarioDoc("A simple operation with path api-version, whose default value is defined as '2022-12-01-preview'. Expected url: '/with-path-api-version/2022-12-01-preview'.")
@route("/with-path-api-version")
@head
op withPathApiVersion(@path apiVersion: string): OkResponse;

@scenario
@scenarioDoc("A simple operation with query api-version, that do NOT use the default but '2021-01-01-preview'. It's expected to be set at the client level. Expected url: '/with-old-query-api-version?api-version=2021-01-01-preview'.")
@route("/with-query-old-api-version")
@head
op withQueryOldApiVersion(@query("api-version") apiVersion: string): OkResponse;
