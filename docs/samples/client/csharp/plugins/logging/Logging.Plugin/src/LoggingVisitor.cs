// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;

namespace Logging.Plugin
{
    public class LoggingVisitor : ScmLibraryVisitor
    {
        protected override ScmMethodProviderCollection Visit(InputServiceMethod serviceMethod,
            ClientProvider clientProvider,
            ScmMethodProviderCollection methodProvider)
        {
            return new LoggingMethodProviderCollection(serviceMethod, clientProvider);
        }
    }
}
