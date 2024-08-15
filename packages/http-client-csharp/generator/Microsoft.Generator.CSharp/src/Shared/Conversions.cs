// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp
{
    internal static class Conversions
    {
        public static ParameterLocation ToParameterLocation(this RequestLocation location)
            => location switch
            {
                RequestLocation.Body => ParameterLocation.Body,
                RequestLocation.Uri => ParameterLocation.Uri,
                _ => ParameterLocation.Unknown,
            };
    }
}
