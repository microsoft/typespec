// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Utilities;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Utilities;
using Azure;
using MappingObject = System.Collections.Generic.Dictionary<string, AutoRest.CSharp.MgmtTest.Models.ExampleParameterValue>;

namespace AutoRest.CSharp.MgmtTest.Models
{
    internal class MockTestCase : OperationExample
    {
        public MockTestCase(string operationId, MgmtTypeProvider carrier, MgmtClientOperation operation, ExampleModel example) : base(operationId, carrier, operation, example)
        {
        }

        protected virtual string GetMethodName(bool hasSuffix)
            => hasSuffix ? $"{Operation.Name}_{Name.ToCleanName()}" : Operation.Name;

        public MethodSignature GetMethodSignature(bool hasSuffix) => new MethodSignature(
                Name: GetMethodName(hasSuffix),
                Description: null,
                Summary: null,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Async,
                ReturnType: typeof(Task),
                ReturnDescription: null,
                Parameters: Array.Empty<Parameter>());

        private MgmtTypeProvider? _parent;
        public MgmtTypeProvider? Parent => _parent ??= GetParent();

        private MgmtTypeProvider? GetParent()
        {
            if (Carrier is not Resource resource)
                return null;
            var parents = resource.GetParents();
            // TODO -- find a way to determine which parent to use. Only for prototype, here we use the first
            // Only when this resource is a "scope resource", we could have multiple parents
            // We could use the value of the scope variable, get the resource type from it to know which resource we should use as a parent here
            return parents.FirstOrDefault();
        }

        private static string GetRequestParameterName(RequestParameter requestParameter)
        {
            var language = requestParameter.Language.Default;
            return language.SerializedName ?? language.Name;
        }

        private MappingObject? _parameterValueMapping;
        public MappingObject ParameterValueMapping => _parameterValueMapping ??= EnsureParameterValueMapping().Item1;

        private MappingObject? _propertyBagParamValueMapping;
        public MappingObject PropertyBagParamValueMapping => _propertyBagParamValueMapping ??= EnsureParameterValueMapping().Item2;

        private IEnumerable<Parameter> GetAllPossibleParameters()
        {
            // skip the first parameter if this method is an extension method, since that will be the extension resource
            var methodParameters = Operation.MethodSignature.Modifiers.HasFlag(MethodSignatureModifiers.Extension) ?
                Operation.MethodParameters.Skip(1) : Operation.MethodParameters;

            // remove the property bag parameter and add the parameter in the property bag
            if (Operation.IsPropertyBagOperation)
            {
                methodParameters = methodParameters.Where(p => !p.IsPropertyBag).Concat(Operation.PropertyBagUnderlyingParameters);
            }

            return Carrier.ExtraConstructorParameters.Concat(methodParameters);
        }

        private Tuple<MappingObject, MappingObject> EnsureParameterValueMapping()
        {
            var result = new MappingObject();
            var propertyBagMapping = new MappingObject();
            var parameters = GetAllPossibleParameters();
            var propertyBagParamNames = Operation.PropertyBagUnderlyingParameters.Select(p => p.Name).ToList();
            // get the "serialized name" of the parameters based on the raw request path
            foreach (var parameter in parameters)
            {
                if (ProcessKnownParameters(result, parameter))
                    continue;

                var exampleParameter = FindExampleParameterBySerializedName(AllParameters, GetParameterSerializedName(parameter.Name));
                // if this parameter is a body parameter, we might have changed it to required, and we cannot tell if we have changed it on the codemodel right now. In this case we just fake an empty body.
                if (parameter.DefaultValue == null && parameter.RequestLocation == RequestLocation.Body)
                {
                    exampleParameter ??= new() { ExampleValue = new() { Properties = new() } };
                }
                if (exampleParameter == null)
                {
                    // if this is a required parameter and we did not find the corresponding parameter in the examples
                    if (parameter.DefaultValue == null)
                    {
                        // this parameter is not from body which means its type should be primary which means "default" keyword should be able to handle
                        // the default value (also string because we disabled nullable in generated code)
                        var warning = $"No value is provided for {parameter.Name} in example '{this.Name}'. Please consider adding a proper example value for it in swagger";
                        AutoRestLogger.Warning(warning).Wait();
                        var pv = new ExampleParameterValue(parameter, $"default /* Warning: {warning}*/");
                        if (Operation.IsPropertyBagOperation && propertyBagParamNames.Contains(parameter.Name))
                        {
                            propertyBagMapping.Add(parameter.Name, pv);
                        }
                        else
                        {
                            result.Add(parameter.Name, pv);
                        }
                    }
                    // if it is optional, we just do not put it in the map indicates that in the invocation we could omit it
                }
                else
                {
                    if (Operation.IsPropertyBagOperation && propertyBagParamNames.Contains(parameter.Name))
                    {
                        propertyBagMapping.Add(parameter.Name, new ExampleParameterValue(parameter, exampleParameter.ExampleValue));
                    }
                    else
                    {
                        result.Add(parameter.Name, new ExampleParameterValue(parameter, exampleParameter.ExampleValue));
                    }
                }
            }

            return Tuple.Create(result, propertyBagMapping);
        }

        private static bool ProcessKnownParameters(MappingObject result, Parameter parameter)
        {
            if (parameter == KnownParameters.WaitForCompletion)
            {
                result.Add(parameter.Name, new ExampleParameterValue(parameter, $"{typeof(WaitUntil)}.Completed"));
                return true;
            }
            if (parameter == KnownParameters.CancellationTokenParameter)
            {
                // we usually do not set this parameter in generated test cases
                return true;
            }

            return false;
        }

        public bool IsConvenientOperation => Operation.IsConvenientOperation;

        public bool IsLro => Operation.IsLongRunningOperation;

        public bool IsPageable => Operation.IsPagingOperation;

        protected override ExampleValue ReplacePathParameterValue(string serializedName, CSharpType type, ExampleValue value)
        {
            if (serializedName == "subscriptionId")
            {
                return new ExampleValue()
                {
                    Language = value.Language,
                    Schema = value.Schema,
                    RawValue = ReplaceValueForSubscriptionId((string)value.RawValue!)
                };
            }

            return value;
        }

        private readonly static Regex _regexForGuid = new Regex("^{[A-Z0-9]{8}-([A-Z0-9]{4}-){3}[A-Z0-9]{12}}$");
        private const string _fallbackSubscriptionId = "00000000-0000-0000-0000-000000000000";

        private string ReplaceValueForSubscriptionId(string rawValue)
        {
            if (_regexForGuid.IsMatch(rawValue))
                return rawValue;

            return _fallbackSubscriptionId;
        }
    }
}
