// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Builders;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input.Source;

using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Output.Models
{
    internal class DataPlaneClient : TypeProvider
    {
        private readonly InputClient _inputClient;
        private readonly DataPlaneOutputLibrary _library;
        private PagingMethod[]? _pagingMethods;
        private ClientMethod[]? _methods;
        private LongRunningOperationMethod[]? _longRunningOperationMethods;

        public DataPlaneClient(InputClient inputClient, DataPlaneRestClient restClient, string defaultName, DataPlaneOutputLibrary library, SourceInputModel? sourceInputModel) : base(Configuration.Namespace, sourceInputModel)
        {
            _inputClient = inputClient;
            _library = library;
            RestClient = restClient;
            DefaultName = defaultName;
        }

        protected override string DefaultName { get; }
        public string Description => ClientBuilder.CreateDescription(_inputClient.Description, ClientBuilder.GetClientPrefix(Declaration.Name, DefaultName));
        public DataPlaneRestClient RestClient { get; }

        public ClientMethod[] Methods => _methods ??= ClientBuilder.BuildMethods(_inputClient, RestClient, Declaration).ToArray();

        public PagingMethod[] PagingMethods => _pagingMethods ??= ClientBuilder.BuildPagingMethods(_inputClient, RestClient, Declaration).ToArray();

        public LongRunningOperationMethod[] LongRunningOperationMethods => _longRunningOperationMethods ??= BuildLongRunningOperationMethods().ToArray();

        protected override string DefaultAccessibility { get; } = "public";

        private IEnumerable<LongRunningOperationMethod> BuildLongRunningOperationMethods()
        {
            foreach (var operation in _inputClient.Operations)
            {
                if (operation.LongRunning == null)
                {
                    continue;
                }

                var name = operation.CleanName;
                RestClientMethod startMethod = RestClient.GetOperationMethod(operation);

                yield return new LongRunningOperationMethod(
                    name,
                    _library.FindLongRunningOperation(operation),
                    startMethod,
                    new Diagnostic($"{Declaration.Name}.Start{name}")
                );
            }
        }

        public IReadOnlyCollection<Parameter> GetClientConstructorParameters(CSharpType credentialType)
        {
            return RestClientBuilder.GetConstructorParameters(RestClient.ClientBuilder.GetOrderedParametersByRequired(), credentialType, false);
        }
    }
}
