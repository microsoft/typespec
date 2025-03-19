// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal class ScmMethodProvider : MethodProvider
    {
        public ScmMethodProvider(
            MethodSignature signature,
            MethodBodyStatement bodyStatements,
            TypeProvider enclosingType,
            XmlDocProvider? xmlDocProvider = default,
            TypeProvider? collectionDefinition = default)
            : base(signature, bodyStatements, enclosingType, xmlDocProvider)
        {
            CollectionDefinition = collectionDefinition;
        }

        internal TypeProvider? CollectionDefinition { get; }
    }
}
