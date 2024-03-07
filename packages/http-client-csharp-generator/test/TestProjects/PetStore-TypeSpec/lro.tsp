import "@typespec/http";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Http;
using Azure.Core;

// separate namespace for hidden operations like LRO polling
namespace Lro {
    /** Operation status */
    @lroStatus
    enum OperationStatus {
        /** Background operation created but not started yet. */
        NotStarted,

        /** Background operation is currently running. */
        Running,

        /** Background operation finished with success. */
        @lroSucceeded
        Succeeded,

        /** Background operation finished with failure. */
        @lroFailed
        Failed,
    }

    model PollingOperationStatus {
        id: string;
        name: string;
        status: OperationStatus;

        @pollingLocation
        @header("Operation-Location")
        opertionLocation: string;
    }

    @get
    @route("/operation/status")
    op getStatus(@query id: string): PollingOperationStatus;
}
