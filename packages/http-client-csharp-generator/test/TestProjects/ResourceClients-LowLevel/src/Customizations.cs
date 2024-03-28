// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Azure.Core;

namespace ResourceClients_LowLevel
{
#pragma warning disable SA1402 // File may only contain a single type
    [CodeGenClient("ServiceClient")]
    public partial class ResourceServiceClient { }

    [CodeGenClient("Group", ParentClient = typeof(ResourceServiceClient))]
    public partial class ResourceGroup { }

    [CodeGenClient("Item", ParentClient = typeof(ResourceGroup))]
    public partial class Resource { }
#pragma warning restore SA1402 // File may only contain a single type
}
