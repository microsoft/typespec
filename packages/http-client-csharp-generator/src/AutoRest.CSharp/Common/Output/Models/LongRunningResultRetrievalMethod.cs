// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Common.Output.Models
{
    /// <summary>
    /// Method to fetch return value specified by `logicalPath` from raw response.
    /// </summary>
    /// <param name="ReturnType">Type of the return value specified by <see cref="ResultPath"/>.</param>
    /// <param name="ResponseTypeName">Name of the raw response type.</param>
    /// <param name="ResultPath">`logicalPath`.</param>
    internal record LongRunningResultRetrievalMethod(CSharpType ReturnType, string ResponseTypeName, string ResultPath)
    {
        public MethodSignature MethodSignature => new(
            Name: $"Fetch{ReturnType.Name}From{ResponseTypeName}",
            Summary: null,
            Description: null,
            Modifiers: MethodSignatureModifiers.Private,
            ReturnType: ReturnType,
            ReturnDescription: null,
            Parameters: new List<Parameter>() { KnownParameters.Response }
            );
    }
}
