// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Security;
using AutoRest.CSharp.Common.Decorator;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Builders;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Mgmt.Decorator.Transformer;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Responses;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Utilities;
using Microsoft.CodeAnalysis.CSharp;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class DataPlaneOutputLibrary : OutputLibrary
    {
        private CachedDictionary<InputClient, DataPlaneRestClient> _restClients;
        private CachedDictionary<InputClient, DataPlaneClient> _clients;
        private CachedDictionary<InputOperation, LongRunningOperation> _operations;
        private CachedDictionary<InputOperation, DataPlaneResponseHeaderGroupType> _headerModels;
        private CachedDictionary<InputEnumType, EnumType> _enums;
        private CachedDictionary<Schema, TypeProvider> _models;
        private CachedDictionary<string, List<string>> _protocolMethodsDictionary;

        private readonly InputNamespace _input;
        private readonly SourceInputModel? _sourceInputModel;
        private readonly Lazy<ModelFactoryTypeProvider?> _modelFactory;
        private readonly string _defaultNamespace;
        private readonly string _libraryName;
        private readonly TypeFactory _typeFactory;
        private readonly SchemaUsageProvider _schemaUsageProvider;

        public DataPlaneOutputLibrary(CodeModel codeModel, SourceInputModel? sourceInputModel)
        {
            _schemaUsageProvider = new SchemaUsageProvider(codeModel); // Create schema usage before transformation applied

            _typeFactory = new TypeFactory(this);
            _sourceInputModel = sourceInputModel;

            // schema usage transformer must run first
            SchemaUsageTransformer.Transform(codeModel);
            DefaultDerivedSchema.AddDefaultDerivedSchemas(codeModel);
            ConstantSchemaTransformer.Transform(codeModel);
            ModelPropertyClientDefaultValueTransformer.Transform(codeModel);

            _input = new CodeModelConverter().CreateNamespace(codeModel, _schemaUsageProvider);

            _defaultNamespace = Configuration.Namespace;
            _libraryName = Configuration.LibraryName;

            _restClients = new CachedDictionary<InputClient, DataPlaneRestClient>(EnsureRestClients);
            _clients = new CachedDictionary<InputClient, DataPlaneClient>(EnsureClients);
            _operations = new CachedDictionary<InputOperation, LongRunningOperation>(EnsureLongRunningOperations);
            _headerModels = new CachedDictionary<InputOperation, DataPlaneResponseHeaderGroupType>(EnsureHeaderModels);
            _enums = new CachedDictionary<InputEnumType, EnumType>(BuildEnums);
            _models = new CachedDictionary<Schema, TypeProvider>(() => BuildModels(codeModel));
            _modelFactory = new Lazy<ModelFactoryTypeProvider?>(() => ModelFactoryTypeProvider.TryCreate(Models, _typeFactory, _sourceInputModel));
            _protocolMethodsDictionary = new CachedDictionary<string, List<string>>(GetProtocolMethodsDictionary);

            ClientOptions = CreateClientOptions();
            Authentication = _input.Auth;
        }

        private ClientOptionsTypeProvider? CreateClientOptions()
        {
            if (!Configuration.PublicClients || !_input.Clients.Any())
            {
                return null;
            }

            var clientPrefix = ClientBuilder.GetClientPrefix(_libraryName, _input.Name);
            return new ClientOptionsTypeProvider(_sourceInputModel?.GetServiceVersionOverrides() ?? _input.ApiVersions, $"{clientPrefix}ClientOptions", Configuration.Namespace, $"Client options for {clientPrefix}Client.", _sourceInputModel);
        }

        public ModelFactoryTypeProvider? ModelFactory => _modelFactory.Value;
        public ClientOptionsTypeProvider? ClientOptions { get; }
        public InputAuth Authentication { get; }
        public IEnumerable<DataPlaneClient> Clients => _clients.Values;
        public IEnumerable<LongRunningOperation> LongRunningOperations => _operations.Values;
        public IEnumerable<DataPlaneResponseHeaderGroupType> HeaderModels => _headerModels.Values;
        public IEnumerable<TypeProvider> Models => _models.Values;
        public IDictionary<string, List<string>> ProtocolMethodsDictionary => _protocolMethodsDictionary;

        public override CSharpType ResolveEnum(InputEnumType enumType) => _enums[enumType].Type;
        public override CSharpType ResolveModel(InputModelType model) => throw new NotImplementedException($"{nameof(ResolveModel)} is not implemented for HLC yet.");

        public override CSharpType FindTypeForSchema(Schema schema) => _models[schema].Type;

        public override TypeProvider FindTypeProviderForSchema(Schema schema) => _models[schema];

        public override CSharpType? FindTypeByName(string originalName)
        {
            foreach (var model in Models)
            {
                if (originalName == model.Type.Name)
                {
                    return model.Type;
                }
            }
            return null;
        }

        private Dictionary<InputEnumType, EnumType> BuildEnums()
        {
            var dictionary = new Dictionary<InputEnumType, EnumType>(InputEnumType.IgnoreNullabilityComparer);
            foreach (var (schema, typeProvider) in _models)
            {
                switch (schema)
                {
                    case SealedChoiceSchema sealedChoiceSchema:
                        dictionary.Add(CodeModelConverter.CreateEnumType(sealedChoiceSchema), (EnumType)typeProvider);
                        break;
                    case ChoiceSchema choiceSchema:
                        dictionary.Add(CodeModelConverter.CreateEnumType(choiceSchema), (EnumType)typeProvider);
                        break;
                }
            }

            return dictionary;
        }

        private Dictionary<Schema, TypeProvider> BuildModels(CodeModel codeModel)
            => codeModel.AllSchemas.ToDictionary(schema => schema, BuildModel);

        private TypeProvider BuildModel(Schema schema)
        {
            return schema switch
            {
                SealedChoiceSchema sealedChoiceSchema => CreateEnumType(CodeModelConverter.CreateEnumType(sealedChoiceSchema)),
                ChoiceSchema choiceSchema => CreateEnumType(CodeModelConverter.CreateEnumType(choiceSchema)),
                ObjectSchema objectSchema => new SchemaObjectType(objectSchema, Configuration.Namespace, _typeFactory, _schemaUsageProvider, this, _sourceInputModel),
                _ => throw new NotImplementedException()
            };

            EnumType CreateEnumType(InputEnumType inputEnumType)
            {
                var accessibility = _schemaUsageProvider.GetUsage(schema).HasFlag(SchemaTypeUsage.Model) ? "public" : "internal";
                return new EnumType(inputEnumType, TypeProvider.GetDefaultModelNamespace(inputEnumType.Namespace, Configuration.Namespace), accessibility, _typeFactory, _sourceInputModel);
            }
        }

        public LongRunningOperation FindLongRunningOperation(InputOperation operation)
        {
            Debug.Assert(operation.LongRunning != null);

            return _operations[operation];
        }

        public DataPlaneClient? FindClient(InputClient inputClient)
        {
            _clients.TryGetValue(inputClient, out var client);
            return client;
        }

        public DataPlaneResponseHeaderGroupType? FindHeaderModel(InputOperation operation)
        {
            _headerModels.TryGetValue(operation, out var model);
            return model;
        }

        private LongRunningOperationInfo FindLongRunningOperationInfo(InputClient inputClient, InputOperation operation)
        {
            var client = FindClient(inputClient);

            Debug.Assert(client != null, "client != null, LROs should be disabled when public clients are disabled.");

            var nextOperationMethod = operation.Paging != null
                ? client.RestClient.GetNextOperationMethod(operation)
                : null;

            return new LongRunningOperationInfo(
                client.Declaration.Accessibility,
                ClientBuilder.GetClientPrefix(client.RestClient.Declaration.Name, string.Empty),
                nextOperationMethod);
        }

        public IEnumerable<DataPlaneRestClient> RestClients => _restClients.Values;

        private Dictionary<InputOperation, DataPlaneResponseHeaderGroupType> EnsureHeaderModels()
        {
            var headerModels = new Dictionary<InputOperation, DataPlaneResponseHeaderGroupType>();
            if (Configuration.GenerateResponseHeaderModels)
            {
                foreach (var inputClient in _input.Clients)
                {
                    var clientPrefix = ClientBuilder.GetClientPrefix(GetClientDeclarationName(inputClient), _input.Name);
                    foreach (var operation in inputClient.Operations)
                    {
                        var headers = DataPlaneResponseHeaderGroupType.TryCreate(operation, _typeFactory, clientPrefix, _sourceInputModel);
                        if (headers != null)
                        {
                            headerModels.Add(operation, headers);
                        }
                    }
                }
            }

            return headerModels;
        }

        private Dictionary<InputOperation, LongRunningOperation> EnsureLongRunningOperations()
        {
            var operations = new Dictionary<InputOperation, LongRunningOperation>();

            if (Configuration.PublicClients && Configuration.GenerateLongRunningOperationTypes)
            {
                foreach (var client in _input.Clients)
                {
                    var clientName = _clients[client].Declaration.Name;
                    var clientPrefix = ClientBuilder.GetClientPrefix(clientName, _input.Name);

                    foreach (var operation in client.Operations)
                    {
                        if (operation.LongRunning is null)
                        {
                            continue;
                        }

                        var existingType = _sourceInputModel?.FindForType(_defaultNamespace, clientName);
                        var accessibility = existingType is not null
                            ? SyntaxFacts.GetText(existingType.DeclaredAccessibility)
                            : "public";

                        operations.Add(operation, new LongRunningOperation(operation, _typeFactory, accessibility, clientPrefix, FindLongRunningOperationInfo(client, operation), _sourceInputModel));
                    }
                }
            }

            return operations;
        }

        private Dictionary<InputClient, DataPlaneClient> EnsureClients()
        {
            var clients = new Dictionary<InputClient, DataPlaneClient>();

            if (Configuration.PublicClients)
            {
                foreach (var inputClient in _input.Clients)
                {
                    clients.Add(inputClient, new DataPlaneClient(inputClient, _restClients[inputClient], GetClientDefaultName(inputClient), this, _sourceInputModel));
                }
            }

            return clients;
        }

        private Dictionary<InputClient, DataPlaneRestClient> EnsureRestClients()
        {
            var restClients = new Dictionary<InputClient, DataPlaneRestClient>();
            foreach (var client in _input.Clients)
            {
                var clientParameters = RestClientBuilder.GetParametersFromOperations(client.Operations).ToList();
                var restClientBuilder = new RestClientBuilder(clientParameters, _typeFactory, this);
                restClients.Add(client, new DataPlaneRestClient(client, restClientBuilder, GetRestClientDefaultName(client), this, _typeFactory, _sourceInputModel));
            }

            return restClients;
        }

        // Get a Dictionary<operationGroupName, List<methodNames>> based on the "protocol-method-list" config
        private static Dictionary<string, List<string>> GetProtocolMethodsDictionary()
        {
            Dictionary<string, List<string>> protocolMethodsDictionary = new();
            foreach (var operationId in Configuration.ProtocolMethodList)
            {
                var operationGroupKeyAndIdArr = operationId.Split('_');

                // If "operationGroup_operationId" passed in the config
                if (operationGroupKeyAndIdArr.Length > 1)
                {
                    var operationGroupKey = operationGroupKeyAndIdArr[0];
                    var methodName = operationGroupKeyAndIdArr[1];
                    AddToProtocolMethodsDictionary(protocolMethodsDictionary, operationGroupKey, methodName);
                }
                // If operationGroup is not present, only operationId is passed in the config
                else
                {
                    AddToProtocolMethodsDictionary(protocolMethodsDictionary, "", operationId);
                }
            }

            return protocolMethodsDictionary;
        }

        private static void AddToProtocolMethodsDictionary(Dictionary<string, List<string>> protocolMethodsDictionary, string operationGroupKey, string methodName)
        {
            if (!protocolMethodsDictionary.ContainsKey(operationGroupKey))
            {
                List<string> methodList = new();
                methodList.Add(methodName);
                protocolMethodsDictionary.Add(operationGroupKey, methodList);
            }
            else
            {
                var methodList = protocolMethodsDictionary[operationGroupKey];
                methodList.Add(methodName);
            }
        }

        private string GetRestClientDefaultName(InputClient inputClient)
        {
            var clientPrefix = ClientBuilder.GetClientPrefix(GetClientDeclarationName(inputClient), _input.Name);
            return clientPrefix + "Rest" + ClientBuilder.GetClientSuffix();
        }

        private string GetClientDeclarationName(InputClient inputClient)
        {
            var defaultName = GetClientDefaultName(inputClient);
            var existingType = _sourceInputModel?.FindForType(_defaultNamespace, defaultName);
            return existingType != null ? existingType.Name : defaultName;
        }

        private string GetClientDefaultName(InputClient inputClient)
        {
            var clientPrefix = ClientBuilder.GetClientPrefix(inputClient.Name, _input.Name);
            var clientSuffix = ClientBuilder.GetClientSuffix();
            return clientPrefix + clientSuffix;
        }
    }
}
