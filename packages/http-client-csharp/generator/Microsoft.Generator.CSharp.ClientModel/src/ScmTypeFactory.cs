// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
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
                    if (typeProvider is ModelProvider modelProvider)
                    {
                        return [new MrwSerializationTypeDefinition(inputModel, modelProvider)];
                    }
                    return [];
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

        /// <summary>
        /// Factory method for creating a <see cref="MethodProviderCollection"/> based on an input operation <paramref name="operation"/>.
        /// </summary>
        /// <param name="operation">The <see cref="InputOperation"/> to convert.</param>
        /// <param name="enclosingType">The <see cref="TypeProvider"/> that will contain the methods.</param>
        /// <returns>An instance of <see cref="MethodProviderCollection"/> containing the chain of methods
        /// associated with the input operation, or <c>null</c> if no methods are constructed.
        /// </returns>
        internal MethodProviderCollection? CreateMethods(InputOperation operation, TypeProvider enclosingType)
        {
            MethodProviderCollection? methods = new ScmMethodProviderCollection(operation, enclosingType);
            var visitors = ClientModelPlugin.Instance.Visitors;

            foreach (var visitor in visitors)
            {
                if (visitor is ScmLibraryVisitor scmVisitor)
                {
                    methods = scmVisitor.Visit(operation, enclosingType, methods);
                }
            }
            return methods;
        }
    }
}
