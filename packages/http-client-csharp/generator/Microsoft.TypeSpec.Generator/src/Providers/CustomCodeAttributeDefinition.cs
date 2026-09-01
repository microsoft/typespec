// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// A base type for custom-code attribute definitions that are generated into the SDK project and made available
    /// to the compiler while it compiles custom code.
    /// </summary>
    public abstract class CustomCodeAttributeDefinition : TypeProvider
    {
        private protected sealed override TypeProvider? BuildCustomCodeView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => null;
        private protected sealed override TypeProvider? BuildLastContractView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => null;
    }
}
