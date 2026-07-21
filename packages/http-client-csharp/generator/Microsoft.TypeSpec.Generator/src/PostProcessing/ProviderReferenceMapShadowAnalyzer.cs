// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator
{
    internal static class ProviderReferenceMapShadowAnalyzer
    {
        private const string UseShadowEnvironmentVariable = "TYPESPEC_PROVIDER_REFERENCE_MAP_USE_SHADOW";

        public static bool UseShadowMap => string.Equals(
            Environment.GetEnvironmentVariable(UseShadowEnvironmentVariable),
            "true",
            StringComparison.OrdinalIgnoreCase);
    }
}
