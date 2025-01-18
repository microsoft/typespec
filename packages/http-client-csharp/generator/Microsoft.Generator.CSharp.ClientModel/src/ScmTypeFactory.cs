// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ScmTypeFactory : TypeFactory
    {
        private Dictionary<InputClient, ClientProvider?>? _clientCache;
        private Dictionary<InputClient, ClientProvider?> ClientCache => _clientCache ??= [];

        public virtual CSharpType MatchConditionsType => typeof(PipelineMessageClassifier);

        public virtual IClientResponseApi ClientResponseApi => ClientResultProvider.Instance;

        public virtual IHttpResponseApi HttpResponseApi => PipelineResponseProvider.Instance;

        public virtual IHttpMessageApi HttpMessageApi => PipelineMessageProvider.Instance;

        public virtual IHttpRequestOptionsApi HttpRequestOptionsApi => RequestOptionsProvider.Instance;

        public virtual IExpressionApi<HttpRequestApi> HttpRequestApi => PipelineRequestProvider.Instance;

        public virtual IClientPipelineApi ClientPipelineApi => ClientPipelineProvider.Instance;

        public virtual IStatusCodeClassifierApi StatusCodeClassifierApi => PipelineMessageClassifierProvider.Instance;

        public virtual IRequestContentApi RequestContentApi => BinaryContentProvider.Instance;

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
                case InputEnumType inputEnumType:
                    switch (typeProvider.CustomCodeView)
                    {
                        case { Type: { IsValueType: true, IsStruct: true } }:
                            return CreateExtensibleEnumSerializations(inputEnumType, typeProvider);
                        case { Type: { IsValueType: true, IsStruct: false } }:
                            return [new FixedEnumSerializationProvider(inputEnumType, typeProvider)];
                    }
                    if (inputEnumType.IsExtensible)
                    {
                        return CreateExtensibleEnumSerializations(inputEnumType, typeProvider);
                    }
                    return [new FixedEnumSerializationProvider(inputEnumType, typeProvider)];
                default:
                    return base.CreateSerializationsCore(inputType, typeProvider);
            }
        }

        private ExtensibleEnumSerializationProvider[] CreateExtensibleEnumSerializations(InputEnumType inputEnumType, TypeProvider typeProvider)
        {
            // if the underlying type is string, we don't need to generate serialization methods as we use ToString
            if (ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(inputEnumType)?.UnderlyingEnumType == typeof(string))
            {
                return [];
            }
            return [new ExtensibleEnumSerializationProvider(inputEnumType, typeProvider)];
        }

        public ClientProvider? CreateClient(InputClient inputClient)
        {
            if (ClientCache.TryGetValue(inputClient, out var client))
            {
                return client;
            }

            client = CreateClientCore(inputClient);

            foreach (var visitor in ClientModelPlugin.Instance.Visitors)
            {
                if (visitor is ScmLibraryVisitor scmVisitor)
                {
                    client = scmVisitor.Visit(inputClient, client);
                }
            }

            var result = client is not null && IsValidClient(client) ? client : null;
            ClientCache[inputClient] = result;
            return result;
        }

        private bool IsValidClient(ClientProvider client)
        {
            // client is valid if it has methods or custom code has methods
            if (client.Methods.Count > 0 || client.CustomCodeView?.Methods.Count > 0)
            {
                return true;
            }

            // client is valid if any of its subclients have methods or custom code has methods
            foreach (var subclient in client.SubClients)
            {
                if (subclient.Methods.Count > 0 || subclient.CustomCodeView?.Methods.Count > 0)
                {
                    return true;
                }
            }

            return false;
        }

        protected virtual ClientProvider? CreateClientCore(InputClient inputClient) => new ClientProvider(inputClient);

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

        public virtual ValueExpression DeserializeJsonValue(Type valueType, ScopedApi<JsonElement> element, SerializationFormat format)
            => MrwSerializationTypeDefinition.DeserializeJsonValueCore(valueType, element, format);

        public virtual MethodBodyStatement SerializeJsonValue(
            Type valueType,
            ValueExpression value,
            ScopedApi<Utf8JsonWriter> utf8JsonWriter,
            ScopedApi<ModelReaderWriterOptions> mrwOptionsParameter,
            SerializationFormat serializationFormat)
            => MrwSerializationTypeDefinition.SerializeJsonValueCore(valueType, value, utf8JsonWriter, mrwOptionsParameter, serializationFormat);
    }
}
