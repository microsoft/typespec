// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;

namespace Logging.Plugin
{
    public class LoggingVisitor : ScmLibraryVisitor
    {
        protected override MethodProviderCollection Visit(InputOperation operation,
            TypeProvider enclosingType,
            MethodProviderCollection methodProvider)
        {
            return new LoggingMethodProviderCollection(operation, enclosingType);
        }
    }
}
