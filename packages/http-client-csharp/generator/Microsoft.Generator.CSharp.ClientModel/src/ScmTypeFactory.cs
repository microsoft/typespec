// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ScmTypeFactory : TypeFactory
    {
        private Dictionary<InputClient, ClientProvider>? _clientCache;
        private Dictionary<InputClient, ClientProvider> ClientCache => _clientCache ??= [];

        /// <summary>
        /// Creates a <see cref="MethodProviderCollection"/> for the given operation. If the operation is a <see cref="InputOperationKinds.DefaultValue"/> operation,
        /// a method collection will be created. Otherwise, <c>null</c> will be returned.
        /// </summary>
        /// <param name="operation">The input operation to create methods for.</param>
        /// <param name="enclosingType">The enclosing type of the operation.</param>
        public override MethodProviderCollection CreateMethods(InputOperation operation, TypeProvider enclosingType) => new ScmMethodProviderCollection(operation, enclosingType);

        public virtual CSharpType MatchConditionsType() => typeof(PipelineMessageClassifier);

        public virtual CSharpType TokenCredentialType() => typeof(ApiKeyCredential);

        /// <summary>
        /// Returns the serialization type providers for the given input type.
        /// </summary>
        /// <param name="inputType">The input type.</param>
        protected override IReadOnlyList<TypeProvider> CreateSerializationsCore(InputType inputType)
        {
            switch (inputType)
            {
                case InputModelType inputModel when inputModel.Usage.HasFlag(InputModelTypeUsage.Json):
                    return [new MrwSerializationTypeDefinition(inputModel)];
                case InputEnumType inputEnumType when inputEnumType.IsExtensible:
                    if (ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(inputEnumType).UnderlyingEnumType.Equals(typeof(string)))
                    {
                        return [];
                    }
                    return [new ExtensibleEnumSerializationProvider(inputEnumType)];
                case InputEnumType inputEnumType:
                    return [new FixedEnumSerializationProvider(inputEnumType)];
                default:
                    return base.CreateSerializationsCore(inputType);
            }
        }

        public ClientProvider CreateClient(InputClient inputClient)
        {
            if (ClientCache.TryGetValue(inputClient, out var client))
            {
                return client;
            }

            client = CreateClientCore(inputClient);
            ClientCache[inputClient] = client;
            return client;
        }

        protected virtual ClientProvider CreateClientCore(InputClient inputClient) => new ClientProvider(inputClient);
    }
}
