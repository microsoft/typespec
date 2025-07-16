import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/** Illustrates the clientNamespace cases. */
@scenarioService("/client/client-namespace")
@scenario
@scenarioDoc("""
  Expected client namespace for clients:
  - ClientNamespaceFirstClient: Client.ClientNamespace
  - ClientNamespaceSecondClient: Client.ClientNamespace.Second
  
  Expected client namespace for models:
  - FirstClientResult: Client.ClientNamespace.First
  - SecondClientResult: Client.ClientNamespace.Second
  - SecondClientEnumType: Client.ClientNamespace.Second.Sub
  """)
namespace Client.ClientNamespace;

interface First {
  #suppress "@azure-tools/cadl-ranch-expect/missing-scenario" "scenario defined in client.tsp"
  @route("/first")
  @get
  getFirst(): FirstModel.FirstClientResult;
}

namespace FirstModel {
  model FirstClientResult {
    name: string;
  }
}

namespace Second {
  #suppress "@azure-tools/cadl-ranch-expect/missing-scenario" "scenario defined in client.tsp"
  @route("/second")
  @get
  op getSecond(): Model.SecondClientResult;

  namespace Model {
    model SecondClientResult {
      type: SecondClientEnumType;
    }

    union SecondClientEnumType {
      string,
      Second: "second",
    }
  }
}
