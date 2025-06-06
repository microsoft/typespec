// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.ClientModel
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

        internal HashSet<InputModelType> RootInputModels
        {
            get
            {
                if (_rootInputModels == null)
                {
                    PopulateRootModels();
                }
                return _rootInputModels!;
            }
        }

        private HashSet<InputModelType>? _rootInputModels;

        internal HashSet<InputModelType> RootOutputModels
        {
            get
            {
                if (_rootOutputModels == null)
                {
                    PopulateRootModels();
                }
                return _rootOutputModels!;
            }
        }
        private HashSet<InputModelType>? _rootOutputModels;

        private void PopulateRootModels()
        {
            _rootInputModels = new HashSet<InputModelType>();
            _rootOutputModels = new HashSet<InputModelType>();
            foreach (var client in ScmCodeModelGenerator.Instance.InputLibrary.InputNamespace.Clients)
            {
                foreach (var method in client.Methods)
                {
                    var operation = method.Operation;
                    var response = operation.Responses.FirstOrDefault(r => !r.IsErrorResponse);
                    // Include both service method and operation responses for output types
                    // Service methods will have the public response type for things like LROs, while operation responses
                    // will have the internal response types for paging operations
                    if (response?.BodyType is InputModelType inputModelType)
                    {
                        _rootOutputModels.Add(inputModelType);
                    }
                    if (method.Response.Type is InputModelType outputModelType)
                    {
                        _rootOutputModels.Add(outputModelType);
                    }

                    if (operation.GenerateConvenienceMethod)
                    {
                        // For parameters, the operation parameters are sufficient.
                        foreach (var parameter in operation.Parameters)
                        {
                            if (parameter.Type is InputModelType modelType)
                            {
                                _rootInputModels.Add(modelType);
                            }
                        }
                    }
                }
            }
        }

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
            if (ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(inputEnumType)?.UnderlyingEnumType == typeof(string))
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

            foreach (var visitor in ScmCodeModelGenerator.Instance.Visitors)
            {
                if (visitor is ScmLibraryVisitor scmVisitor)
                {
                    client = scmVisitor.Visit(inputClient, client);
                }
            }

            ClientCache[inputClient] = client;
            return client;
        }

        protected virtual ClientProvider? CreateClientCore(InputClient inputClient) => new ClientProvider(inputClient);

        /// <summary>
        /// Factory method for creating a <see cref="MethodProviderCollection"/> based on an input method <paramref name="serviceMethod"/>.
        /// </summary>
        /// <param name="serviceMethod">The <see cref="InputServiceMethod"/> to convert.</param>
        /// <param name="enclosingType">The <see cref="TypeProvider"/> that will contain the methods.</param>
        /// <returns>An instance of <see cref="MethodProviderCollection"/> containing the chain of methods
        /// associated with the input service method, or <c>null</c> if no methods are constructed.
        /// </returns>
        internal ScmMethodProviderCollection? CreateMethods(InputServiceMethod serviceMethod, ClientProvider enclosingType)
        {
            ScmMethodProviderCollection? methods = new ScmMethodProviderCollection(serviceMethod, enclosingType);
            var visitors = ScmCodeModelGenerator.Instance.Visitors;

            foreach (var visitor in visitors)
            {
                if (visitor is ScmLibraryVisitor scmVisitor)
                {
                    methods = scmVisitor.Visit(serviceMethod, enclosingType, methods);
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
