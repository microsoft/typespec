// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.ClientModel
{
    public abstract class ScmLibraryVisitor : LibraryVisitor
    {
        protected internal virtual ScmClientMethodProviderCollection? Visit(
            InputServiceMethod serviceMethod,
            ClientProvider enclosingType,
            ScmClientMethodProviderCollection? methodProviderCollection)
        {
            return methodProviderCollection;
        }

        protected internal virtual ClientProvider? Visit(InputClient client, ClientProvider? clientProvider)
        {
            return clientProvider;
        }

        protected override MethodProvider? VisitMethod(MethodProvider method)
        {
            if (method is ScmClientMethodProvider scmMethod)
            {
                return VisitMethod(scmMethod);
            }

            return base.VisitMethod(method);
        }

        protected internal virtual ScmClientMethodProvider? VisitMethod(ScmClientMethodProvider clientMethod)
        {
            return clientMethod;
        }
    }
}
