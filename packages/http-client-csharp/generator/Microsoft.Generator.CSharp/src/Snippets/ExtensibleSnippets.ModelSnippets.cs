// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Snippets
{
    public abstract partial class ExtensibleSnippets
    {
        public abstract class ModelSnippets
        {
            public abstract MethodProvider BuildFromOperationResponseMethod(TypeProvider typeProvider, MethodSignatureModifiers modifiers);
        }
    }
}
