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
        public enum MethodType
        {
            /// <summary>
            /// Internal method that creates HTTP request messages.
            /// </summary>
            CreateRequest,
            /// <summary>
            /// Protocol method that handles raw requests and responses.
            /// </summary>
            Protocol,
            /// <summary>
            /// Convenience method with strongly-typed parameters and return values.
            /// </summary>
            Convenience
        }
        public InputServiceMethod? ServiceMethod { get; }
        public TypeProvider? CollectionDefinition { get; }

        /// <summary>
        /// Gets the method type (CreateRequest, Protocol, or Convenience).
        /// </summary>
        public MethodType Type { get; }

        /// <summary>
        /// Gets a value indicating whether this method is a CreateRequest method.
        /// CreateRequest methods are internal methods that create HTTP messages for protocol methods.
        /// </summary>
        public bool IsCreateRequestMethod => Type == MethodType.CreateRequest;

        /// <summary>
        /// Gets a value indicating whether this method is a protocol method.
        /// Protocol methods handle raw requests and responses.
        /// </summary>
        public bool IsProtocolMethod => Type == MethodType.Protocol;

        /// <summary>
        /// Gets a value indicating whether this method is a convenience method.
        /// Convenience methods provide strongly-typed parameters and return types.
        /// </summary>
        public bool IsConvenienceMethod => Type == MethodType.Convenience;

        public ScmMethodProvider(
            MethodSignature signature,
            MethodBodyStatement bodyStatements,
            TypeProvider enclosingType,
            MethodType methodType,
            XmlDocProvider? xmlDocProvider = default,
            TypeProvider? collectionDefinition = default,
            InputServiceMethod? serviceMethod = default)
            : base(signature, bodyStatements, enclosingType, xmlDocProvider)
        {
            CollectionDefinition = collectionDefinition;
            ServiceMethod = serviceMethod;
            Type = methodType;
        }
    }
}
