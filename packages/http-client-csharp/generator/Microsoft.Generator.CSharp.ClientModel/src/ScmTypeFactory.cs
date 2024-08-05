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

        public virtual CSharpType MatchConditionsType() => typeof(PipelineMessageClassifier);

        public virtual CSharpType TokenCredentialType() => typeof(ApiKeyCredential);

        /// <summary>
        /// Returns the serialization type providers for the given input type.
        /// </summary>
        /// <param name="inputType">The input type.</param>
        /// <param name="typeProvider">The type provider.</param>
        protected override IReadOnlyList<TypeProvider> CreateSerializationsCore(InputType inputType, TypeProvider typeProvider)
        {
            switch (inputType)
            {
                case InputModelType inputModel when inputModel.Usage.HasFlag(InputModelTypeUsage.Json):
                    return [new MrwSerializationTypeDefinition(inputModel, typeProvider)];
                case InputEnumType { IsExtensible: true } inputEnumType:
                    if (ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(inputEnumType)?.UnderlyingEnumType.Equals(typeof(string)) == true)
                    {
                        return [];
                    }
                    return [new ExtensibleEnumSerializationProvider(inputEnumType, typeProvider)];
                case InputEnumType inputEnumType:
                    return [new FixedEnumSerializationProvider(inputEnumType, typeProvider)];
                default:
                    return base.CreateSerializationsCore(inputType, typeProvider);
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
