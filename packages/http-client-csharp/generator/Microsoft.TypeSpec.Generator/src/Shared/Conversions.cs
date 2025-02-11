// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator
{
    internal static class Conversions
    {
        public static ParameterLocation ToParameterLocation(this RequestLocation location)
            => location switch
            {
                RequestLocation.Body => ParameterLocation.Body,
                RequestLocation.Uri => ParameterLocation.Uri,
                RequestLocation.Path => ParameterLocation.Path,
                RequestLocation.Query => ParameterLocation.Query,
                RequestLocation.Header => ParameterLocation.Header,
                _ => ParameterLocation.Unknown,
            };
    }
}
