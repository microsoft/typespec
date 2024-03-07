// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using Azure.Core;

namespace MgmtExtensionResource.Models
{
    /// <summary> An error response from a policy operation. </summary>
    internal partial class CloudError
    {
        /// <summary> Error response indicates that the service is not able to process the incoming request. The reason is provided in the error message. </summary>
        [CodeGenMember("Error")]
        internal ErrorResponse ErrorResponse { get; }
    }
}
