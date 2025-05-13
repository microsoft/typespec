// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;

namespace Logging.Plugin
{
    public class LoggingVisitor : ScmLibraryVisitor
    {
        protected override ScmMethodProviderCollection Visit(InputServiceMethod serviceMethod,
            TypeProvider enclosingType,
            ScmMethodProviderCollection methodProvider)
        {
            return new LoggingMethodProviderCollection(serviceMethod, enclosingType);
        }
    }
}
