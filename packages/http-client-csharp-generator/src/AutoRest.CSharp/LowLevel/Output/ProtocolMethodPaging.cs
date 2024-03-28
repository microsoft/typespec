// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Responses;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Input;

namespace AutoRest.CSharp.Output.Models
{
    internal record ProtocolMethodPaging(RestClientMethod? NextPageMethod, string? NextLinkName, string ItemName);
}
