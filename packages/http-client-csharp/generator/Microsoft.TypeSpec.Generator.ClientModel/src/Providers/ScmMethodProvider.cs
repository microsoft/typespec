// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class ScmMethodProvider : MethodProvider
    {
        public ScmMethodProvider(
            MethodSignature signature,
            MethodBodyStatement bodyStatements,
            TypeProvider enclosingType,
            XmlDocProvider? xmlDocProvider = default,
            TypeProvider? collectionDefinition = default,
            bool isProtocolMethod = false,
            bool isCreateRequestMethod = false,
            bool isConvenienceMethod = false)
            : base(signature, bodyStatements, enclosingType, xmlDocProvider)
        {
            CollectionDefinition = collectionDefinition;
            IsProtocolMethod = isProtocolMethod;
            IsCreateRequestMethod = isCreateRequestMethod;
            IsConvenienceMethod = isConvenienceMethod;
        }

        internal TypeProvider? CollectionDefinition { get; }
        public bool IsProtocolMethod { get; }
        public bool IsConvenienceMethod { get; }
        public bool IsCreateRequestMethod { get; }
    }
}
