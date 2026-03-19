import "../../../../../../docs/samples/client/csharp/SampleService/main.tsp";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

namespace SampleTypeSpec;

// E2E example demonstrating @paramAlias with @clientInitialization.
// The client parameter "notebook" is aliased to the operation's "notebookName" path parameter,
// allowing a different parameter name in client initialization while mapping to the original
// operation parameter name on the wire.
model NotebookClientParams {
  @paramAlias("notebookName")
  notebook: string;
}

@clientInitialization({
  initializedBy: InitializedBy.individually | InitializedBy.parent,
  parameters: NotebookClientParams,
})
interface Notebooks {
  @doc("Get a notebook by name")
  @get
  @route("/notebooks/{notebookName}")
  getNotebook(@path notebookName: string): {
    name: string;
    content: string;
  };
}
