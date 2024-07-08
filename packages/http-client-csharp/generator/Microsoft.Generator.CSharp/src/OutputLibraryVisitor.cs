// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    public abstract class OutputLibraryVisitor
    {
        public virtual TypeProvider? Visit(TypeProvider typeProvider)
        {
            return typeProvider;
        }

        public virtual MethodProvider? Visit(TypeProvider typeProvider, MethodProvider methodProvider)
        {
            return methodProvider;
        }

        public virtual PropertyProvider? Visit(TypeProvider typeProvider, PropertyProvider propertyProvider)
        {
            return propertyProvider;
        }
    }
}
