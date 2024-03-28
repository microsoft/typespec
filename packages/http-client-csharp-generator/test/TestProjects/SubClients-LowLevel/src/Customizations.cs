// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Azure.Core;

namespace SubClients_LowLevel
{
    [CodeGenClient("ParameterClient", ParentClient = typeof(RootClient))]
    public partial class Parameter { }
}
