import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Illustrates not-versioned server.
 */
@service
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
@route("/server/versions/not-versioned")
namespace Server.Versions.NotVersioned;

@scenario
@scenarioDoc("A simple operation without api-version. Expected url: '/without-api-version', it should not contain any api-version.")
@route("/without-api-version")
@head
op withoutApiVersion(): OkResponse;

@scenario
@scenarioDoc("A simple operation with query api-version, which doesn't have any default value. Expected url: '/with-query-api-version?api-version=v1.0'.")
@route("/with-query-api-version")
@head
op withQueryApiVersion(@query("api-version") apiVersion: string): OkResponse;

@scenario
@scenarioDoc("A simple operation with path api-version, which doesn't have any default value. Expected url: '/with-path-api-version/v1.0'.")
@route("/with-path-api-version")
@head
op withPathApiVersion(@path apiVersion: string): OkResponse;
