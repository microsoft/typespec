// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Mgmt.Output
{
    internal class MgmtRestClient : CmcRestClient
    {
        public static readonly Parameter ApplicationIdParameter = new("applicationId", $"The application id to use for user agent", new CSharpType(typeof(string)), null, ValidationType.None, null);

        private readonly MgmtRestClientBuilder _clientBuilder;
        private IReadOnlyList<Resource>? _resources;

        public ClientFields Fields { get; }

        public MgmtRestClient(OperationGroup operationGroup, MgmtRestClientBuilder clientBuilder)
            : base(operationGroup, MgmtContext.Context, operationGroup.Language.Default.Name, GetOrderedParameters(clientBuilder))
        {
            _clientBuilder = clientBuilder;
            Fields = ClientFields.CreateForRestClient(new[] { KnownParameters.Pipeline }.Union(clientBuilder.GetOrderedParametersByRequired()));
        }

        protected override Dictionary<ServiceRequest, RestClientMethod> EnsureNormalMethods()
        {
            var requestMethods = new Dictionary<ServiceRequest, RestClientMethod>();

            foreach (var operation in OperationGroup.Operations)
            {
                foreach (var serviceRequest in operation.Requests)
                {
                    // See also LowLevelRestClient::EnsureNormalMethods if changing
                    if (serviceRequest.Protocol.Http is not HttpRequest httpRequest)
                    {
                        continue;
                    }
                    requestMethods.Add(serviceRequest, _clientBuilder.BuildMethod(operation, httpRequest, serviceRequest.Parameters, null, "public", ShouldReturnNullOn404(operation)));
                }
            }

            return requestMethods;
        }

        private static Func<string?, bool> ShouldReturnNullOn404(Operation operation)
        {
            Func<string?, bool> f = delegate (string? responseBodyType)
            {
                if (!MgmtContext.Library.TryGetResourceData(operation.GetHttpPath(), out var resourceData))
                    return false;
                if (!operation.IsGetResourceOperation(responseBodyType, resourceData))
                    return false;

                return operation.Responses.Any(r => r.ResponseSchema == resourceData.ObjectSchema);
            };
            return f;
        }

        public IReadOnlyList<Resource> Resources => _resources ??= GetResources();

        private IReadOnlyList<Resource> GetResources()
        {
            HashSet<Resource> candidates = new HashSet<Resource>();
            foreach (var operation in OperationGroup.Operations)
            {
                foreach (var resource in operation.GetResourceFromResourceType())
                {
                    candidates.Add(resource);
                }
            }
            return candidates.ToList();
        }

        private static IReadOnlyList<Parameter> GetOrderedParameters(CmcRestClientBuilder clientBuilder)
            => new[] {KnownParameters.Pipeline, ApplicationIdParameter}.Union(clientBuilder.GetOrderedParametersByRequired()).ToArray();
    }
}
