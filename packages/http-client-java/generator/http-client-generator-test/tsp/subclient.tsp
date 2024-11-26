import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Spector;
using Azure.ClientGenerator.Core;

/**
 * Describe client with `@clientInitialization`
 */
@scenarioService("/client/initialization/basic")
@scenario
@scenarioDoc("""
  Testing that "SubClient" be initialized with "name" client property,
  and that the "action" API under "SubClient" does not take "name" parameter in method signature.
  """)
namespace TspTest.ClientInitialization;

model SubClientOptions {
  name: string;
}

@clientInitialization(SubClientOptions)
interface SubClient {
  @post
  @route("/sub-client/{name}:action")
  action(@path name: string, @query type: string): void;
}
