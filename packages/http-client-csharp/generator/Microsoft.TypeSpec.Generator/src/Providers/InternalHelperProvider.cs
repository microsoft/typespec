// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// A base provider for generator-owned internal helper types that must not be removed during post-processing.
    /// </summary>
    public abstract class InternalHelperProvider : TypeProvider
    {
        protected InternalHelperProvider(InputType? inputType = default) : base(inputType)
        {
            CodeModelGenerator.Instance.AddTypeToKeep(this, isRoot: false);
        }

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
    }
}
