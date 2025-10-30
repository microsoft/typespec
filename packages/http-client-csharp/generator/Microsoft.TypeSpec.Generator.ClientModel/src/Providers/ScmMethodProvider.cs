// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class ScmMethodProvider : MethodProvider
    {
        public InputServiceMethod? ServiceMethod { get; }
        public TypeProvider? CollectionDefinition { get; }

        /// <summary>
        /// Gets the kind of method (CreateRequest, Protocol, or Convenience).
        /// </summary>
        public ScmMethodKind Kind { get; }

        public ScmMethodProvider(
            MethodSignature signature,
            MethodBodyStatement bodyStatements,
            TypeProvider enclosingType,
            ScmMethodKind methodKind,
            XmlDocProvider? xmlDocProvider = default,
            TypeProvider? collectionDefinition = default,
            InputServiceMethod? serviceMethod = default)
            : base(signature, bodyStatements, enclosingType, xmlDocProvider)
        {
            CollectionDefinition = collectionDefinition;
            ServiceMethod = serviceMethod;
            Kind = methodKind;
        }
    }
}
