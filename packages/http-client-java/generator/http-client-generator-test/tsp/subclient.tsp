import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

/**
 * Describe client with `@clientInitialization`
 */
@supportedBy("dpg")
@scenarioService("/client/initialization/basic")
@scenario
@scenarioDoc("""
  Testing that "SubClient" be initialized with "name" client property,
  and that the "action" API under "SubClient" does not take "name" parameter in method signature.

  Use "subclient1" as "name" parameter in test.
  """)
namespace TspTest.ClientInitialization;

model SubClientOptions {
  name: string;
}

@clientInitialization(SubClientOptions)
interface SubClient {
  @post
  @route("/sub-client/{name}:action")
  action(@path name: string): void;
}
