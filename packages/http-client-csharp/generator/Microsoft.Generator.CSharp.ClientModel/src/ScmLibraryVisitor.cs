// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public abstract class ScmLibraryVisitor : LibraryVisitor
    {
        protected internal virtual MethodProviderCollection? Visit(InputOperation operation,
            TypeProvider enclosingType,
            MethodProviderCollection? methodProviderCollection)
        {
            return methodProviderCollection;
        }

        protected internal virtual ClientProvider? Visit(InputClient client, ClientProvider? clientProvider)
        {
            return clientProvider;
        }
    }
}
