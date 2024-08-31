// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using TypeSpec.Generator.Input;
using TypeSpec.Generator.Providers;

namespace TypeSpec.Generator.ClientModel
{
    public abstract class ScmLibraryVisitor : LibraryVisitor
    {
        protected internal virtual MethodProviderCollection? Visit(InputOperation operation,
            TypeProvider enclosingType,
            MethodProviderCollection? methodProviderCollection)
        {
            return methodProviderCollection;
        }
    }
}
