import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

@service(
    {
        title: "clientAndOperationGroupService",
        version: "2015-06-18"
    }
)
@server(
    "{operationGroupServiceUrl}",
    "OperationGroup Service",
    {
        operationGroupServiceUrl: string,
    }
)
namespace ClientAndOperationGroup;

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

namespace Alpha {
    #suppress "@azure-tools/cadl-azure-core/use-standard-operations" "This is test code."
    @route("/Alpha")
    op one(): string;
}

@operationGroup
namespace Beta {
    #suppress "@azure-tools/cadl-azure-core/use-standard-operations" "This is test code."
    @route("/Beta")
    op two(): string;

    namespace SubBeta {
    #suppress "@azure-tools/cadl-azure-core/use-standard-operations" "This is test code."
        @route("/SubBeta")
        op three(): string;
    }
}

@operationGroup
namespace Gamma {
    #suppress "@azure-tools/cadl-azure-core/use-standard-operations" "This is test code."
    @route("/Gamma")
    op four(): string;

    #suppress "@azure-tools/cadl-azure-core/use-standard-operations" "This is test code."
    @route("/Gamma")
    @put op five(): string;
}

@route("/top")
op zero(): string;