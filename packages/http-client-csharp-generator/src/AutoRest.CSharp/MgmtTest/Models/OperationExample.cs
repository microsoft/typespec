// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models.Requests;

namespace AutoRest.CSharp.MgmtTest.Models
{
    internal class OperationExample
    {
        internal protected ExampleModel _example;
        public string OperationId { get; }
        public string Name => _example.Name;

        public MgmtTypeProvider Carrier { get; }

        /// <summary>
        /// The Owner of this Operation means which test class this test operation will go into
        /// if the provider is a resource, the owner is the resource (this includes the ResourceCollection). Otherwise, for instance the extensions, use the Operation.Resource as its owner. Use the Carrier as a fallback
        /// </summary>
        public MgmtTypeProvider Owner => Carrier is Resource ? Carrier : (Operation.Resource ?? Carrier);
        public MgmtClientOperation Operation { get; }

        private MgmtRestOperation? _restOperation;
        public MgmtRestOperation RestOperation => _restOperation ??= GetRestOperationFromOperationId();
        public RequestPath RequestPath => RestOperation.RequestPath;

        /// <summary>
        /// All the parameters defined in this test case
        /// We do not need to distiguish between ClientParameters and MethodParameters because we usually change that in code model transformation
        /// </summary>
        public IEnumerable<ExampleParameter> AllParameters => _example.AllParameters;
        private IEnumerable<ExampleParameter>? _pathParameters;
        public IEnumerable<ExampleParameter> PathParameters => _pathParameters ??= AllParameters.Where(p => p.Parameter.In == HttpParameterIn.Path);

        protected OperationExample(string operationId, MgmtTypeProvider carrier, MgmtClientOperation operation, ExampleModel example)
        {
            OperationId = operationId;
            _example = example;
            Carrier = carrier;
            Operation = operation;
        }

        private MgmtRestOperation GetRestOperationFromOperationId()
        {
            foreach (var operation in Operation)
            {
                if (operation.OperationId == OperationId)
                    return operation;
            }

            throw new InvalidOperationException($"Cannot find operationId {OperationId} in example {_example.Name}");
        }

        /// <summary>
        /// Returns the values to construct a resource identifier for the input request path of the resource
        /// This method does not validate the parenting relationship between the request path passing in and the request path inside this test case
        /// The passing in request path should always be a parent of the request path in this test case
        /// </summary>
        /// <param name="resourcePath"></param>
        /// <returns></returns>
        public IEnumerable<ResourceIdentifierInitializer> ComposeResourceIdentifierExpressionValues(RequestPath resourcePath)
        {
            var scopePath = resourcePath.GetScopePath();
            if (scopePath.IsRawParameterizedScope())
            {
                var trimmedPath = resourcePath.TrimScope();
                return ComposeResourceIdentifierForScopePath(scopePath, trimmedPath);
            }
            else
            {
                return ComposeResourceIdentifierForUsualPath(RequestPath, resourcePath);
            }
        }

        private IEnumerable<ResourceIdentifierInitializer> ComposeResourceIdentifierForScopePath(RequestPath scopePath, RequestPath trimmedPath)
        {
            // we need to find the scope, and put everything in the scope into the scope parameter
            var operationScopePath = RequestPath.GetScopePath();
            var operationTrimmedPath = RequestPath.TrimScope();

            var scopeValues = new List<ExampleParameterValue>();
            foreach (var referenceSegment in operationScopePath.Where(segment => segment.IsReference))
            {
                scopeValues.Add(FindExampleParameterValueFromReference(referenceSegment.Reference));
            }

            if (operationScopePath.Count == 1)
                yield return new ResourceIdentifierInitializer(scopeValues.Single());
            else
                yield return new ResourceIdentifierInitializer(operationScopePath, scopeValues);

            foreach (var referenceSegment in operationTrimmedPath.Take(trimmedPath.Count).Where(segment => segment.IsReference))
            {
                yield return new ResourceIdentifierInitializer(FindExampleParameterValueFromReference(referenceSegment.Reference));
            }
        }

        private IEnumerable<ResourceIdentifierInitializer> ComposeResourceIdentifierForUsualPath(RequestPath requestPath, RequestPath resourcePath)
        {
            // try to figure out ref segments from requestPath according the ones from resource Path
            // Dont match the path side-by-side because
            // 1. there is a case that the parameter names are different
            // 2. the path structure may be different totally when customized,
            //    i.e. in ResourceManager, parent of /subscriptions/{subscriptionId}/providers/Microsoft.Features/providers/{resourceProviderNamespace}/features/{featureName}
            //         is configured to /subscriptions/{subscriptionId}/providers/{resourceProviderNamespace}
            var myRefs = requestPath.Where(s => s.IsReference);
            var resourceRefCount = resourcePath.Where(s => s.IsReference).Count();
            return myRefs.Take(resourceRefCount).Select(refSeg => new ResourceIdentifierInitializer(FindExampleParameterValueFromReference(refSeg.Reference)));
        }

        private ExampleParameterValue FindExampleParameterValueFromReference(Reference reference)
        {
            // find a path parameter in our path parameters for one with same name
            var serializedName = GetParameterSerializedName(reference.Name);
            var parameter = FindPathExampleParameterBySerializedName(serializedName);
            var exampleValue = ReplacePathParameterValue(serializedName, reference.Type, parameter.ExampleValue);

            return new ExampleParameterValue(reference, exampleValue);
        }

        protected virtual ExampleValue ReplacePathParameterValue(string serializedName, CSharpType type, ExampleValue value)
            => value;

        private Dictionary<string, string> EnsureParameterSerializedNames()
        {
            if (_parameterNameToSerializedNameMapping != null)
                return _parameterNameToSerializedNameMapping;

            _parameterNameToSerializedNameMapping = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var operation = _example.Operation;
            var serviceRequest = operation.GetServiceRequest()!;

            var allRequestParameters = operation.Parameters.Concat(serviceRequest.Parameters);

            foreach (var requestParameter in allRequestParameters)
            {
                var serializedName = GetRequestParameterName(requestParameter);
                _parameterNameToSerializedNameMapping.Add(requestParameter.Language.Default.Name, serializedName);
            }

            return _parameterNameToSerializedNameMapping;
        }

        private Dictionary<string, string>? _parameterNameToSerializedNameMapping;

        protected string GetParameterSerializedName(string name) => EnsureParameterSerializedNames()[name];

        private static string GetRequestParameterName(RequestParameter requestParameter)
        {
            var language = requestParameter.Language.Default;
            return language.SerializedName ?? language.Name;
        }

        private ExampleParameter FindPathExampleParameterBySerializedName(string serializedName)
        {
            var parameter = FindExampleParameterBySerializedName(PathParameters, serializedName);

            // we throw exceptions here because path parameter cannot be optional, therefore if we do not find a parameter in the example, there must be an issue in the example
            if (parameter == null)
                throw new InvalidOperationException($"Cannot find a parameter in test case {_example.Name} with the name of {serializedName}");

            return parameter;
        }

        protected ExampleParameter? FindExampleParameterBySerializedName(IEnumerable<ExampleParameter> parameters, string name)
            => parameters.FirstOrDefault(p => GetRequestParameterName(p.Parameter) == name);
    }
}
