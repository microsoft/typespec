import "@azure-tools/typespec-client-generator-core";
import "./main.tsp";

using Azure.ClientGenerator.Core;

@TypeSpec.Versioning.useDependency(Azure.Core.Versions.v1_0_Preview_2)
@TypeSpec.Versioning.useDependency(Azure.Batch.Versions.v2024_07_01)
namespace Client;
#suppress "@azure-tools/typespec-azure-core/use-standard-operations" ""
#suppress "@azure-tools/typespec-azure-core/no-rpc-path-params" ""
#suppress "deprecated" ""
@client({
  name: "BatchClient",
  service: Azure.Batch,
})
interface BatchClient {
  listPools is Azure.Batch.Pools.listPools;
  listCertificates is Azure.Batch.Certificates.listCertificates;
}
