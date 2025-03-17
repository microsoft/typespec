// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator
{
    internal static class Conversions
    {
        public static ParameterLocation ToParameterLocation(this InputRequestLocation location)
            => location switch
            {
                InputRequestLocation.Body => ParameterLocation.Body,
                InputRequestLocation.Uri => ParameterLocation.Uri,
                InputRequestLocation.Path => ParameterLocation.Path,
                InputRequestLocation.Query => ParameterLocation.Query,
                InputRequestLocation.Header => ParameterLocation.Header,
                _ => ParameterLocation.Unknown,
            };
    }
}
