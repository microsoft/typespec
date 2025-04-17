import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.Core;
using Azure.Core.Foundations;
using Azure.ClientGenerator.Core;

@service(#{ title: "Namespace" })
namespace TspTest.NamespaceClient {
  op get(): TspTest.NamespaceModel.Model;
}

namespace TspTest.NamespaceModel {
  model Model {
    name: string;
  }
}
