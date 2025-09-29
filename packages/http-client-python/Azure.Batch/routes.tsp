import "@typespec/http";
import "@azure-tools/typespec-azure-core";
import "@typespec/rest";
import "./models.tsp";
import "./common.tsp";

using TypeSpec.Http;

namespace Azure.Batch;


// Pool Interface
#suppress "@azure-tools/typespec-azure-core/no-response-body" ""
#suppress "@azure-tools/typespec-azure-core/no-rpc-path-params" ""
#suppress "@azure-tools/typespec-azure-core/use-standard-operations" ""
#suppress "@azure-tools/typespec-azure-core/no-error-status-codes" ""
@tag("Pools")
interface Pools {

  @summary("Lists all of the Pools which be mounted.")
  @doc("Lists all of the Pools which be mounted.")
  @list
  @route("/pools")
  listPools is ListOperation<
    {
      ...CommonListParameters;
      ...ListPoolsOptionalParameters;
    },
    BatchPoolListResult
  >;
}

// Certificate Interface
#suppress "@azure-tools/typespec-azure-core/no-response-body" ""
#suppress "@azure-tools/typespec-azure-core/no-rpc-path-params" ""
@tag("Certificates")
interface Certificates {

  #deprecated "Warning: This operation is deprecated and will be removed after February, 2024. Please use the [Azure KeyVault Extension](https://learn.microsoft.com/azure/batch/batch-certificate-migration-guide) instead."
  @summary("Lists all of the Certificates that have been added to the specified Account.")
  @doc("Lists all of the Certificates that have been added to the specified Account.")
  @list
  @route("/certificates")
  listCertificates is ListOperation<
    {
      ...CommonListParameters;
      ...ListCertificatesOptionalParameters;
    },
    BatchCertificateListResult
  >;
}
