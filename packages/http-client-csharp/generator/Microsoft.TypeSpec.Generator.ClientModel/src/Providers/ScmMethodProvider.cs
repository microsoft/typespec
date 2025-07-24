// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class ScmMethodProvider : MethodProvider
    {
        public InputServiceMethod? ServiceMethod { get; }
        public TypeProvider? CollectionDefinition { get; private set; }
        public bool IsProtocolMethod { get; }

        public ScmMethodProvider(
            MethodSignature signature,
            MethodBodyStatement bodyStatements,
            TypeProvider enclosingType,
            XmlDocProvider? xmlDocProvider = default,
            TypeProvider? collectionDefinition = default,
            InputServiceMethod? serviceMethod = default,
            bool isProtocolMethod = false)
            : base(signature, bodyStatements, enclosingType, xmlDocProvider)
        {
            CollectionDefinition = collectionDefinition;
            IsProtocolMethod = isProtocolMethod;
            ServiceMethod = serviceMethod;
        }

        public void Update(TypeProvider? collectionDefinition = null)
        {
            if (collectionDefinition != null)
            {
                CollectionDefinition = collectionDefinition;
            }
        }
    }
}
