// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Input.Examples;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.LowLevel.Extensions;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Azure;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Output.Samples.Models
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    internal class DpgOperationSample
    {
        public DpgOperationSample(LowLevelClient client, TypeFactory typeFactory, LowLevelClientMethod method, IEnumerable<InputParameterExample> inputClientParameterExamples, InputOperationExample inputOperationExample, bool isConvenienceSample, string exampleKey)
        {
            _client = client;
            _typeFactory = typeFactory;
            _method = method;
            _inputClientParameterExamples = inputClientParameterExamples;
            _inputOperationExample = inputOperationExample;
            IsConvenienceSample = isConvenienceSample;
            ExampleKey = exampleKey;
            IsAllParametersUsed = exampleKey == ExampleMockValueBuilder.MockExampleAllParameterKey; // TODO -- only work around for the response usage building.
            _operationMethodSignature = isConvenienceSample ? method.ConvenienceMethod!.Signature : method.ProtocolMethodSignature;
        }

        protected internal readonly IEnumerable<InputParameterExample> _inputClientParameterExamples;
        protected internal readonly InputOperationExample _inputOperationExample;
        protected internal readonly LowLevelClient _client;
        protected internal readonly LowLevelClientMethod _method;
        private readonly TypeFactory _typeFactory;
        private readonly MethodSignature _operationMethodSignature;
        public bool IsAllParametersUsed { get; }
        public string ExampleKey { get; }
        public bool IsConvenienceSample { get; }
        public string? ResourceName => _inputOperationExample.Operation.ResourceName;
        public string InputOperationName => _inputOperationExample.Operation.Name;

        public MethodSignature OperationMethodSignature => _operationMethodSignature;

        public bool IsLongRunning => IsConvenienceSample ? _method.ConvenienceMethod!.IsLongRunning : _method.LongRunning != null;

        public bool IsPageable => IsConvenienceSample ? _method.ConvenienceMethod!.IsPageable : _method.PagingInfo != null;

        private IReadOnlyList<MethodSignatureBase>? _clientInvocationChain;
        public IReadOnlyList<MethodSignatureBase> ClientInvocationChain => _clientInvocationChain ??= GetClientInvocationChain();

        /// <summary>
        /// Get the methods to be called to get the client, it should be like `Client(...).GetXXClient(..).GetYYClient(..)`.
        /// It's composed of a constructor of non-subclient and a optional list of subclient factory methods.
        /// </summary>
        /// <returns></returns>
        private IReadOnlyList<MethodSignatureBase> GetClientInvocationChain()
        {
            var client = _client;
            var callChain = new Stack<MethodSignatureBase>();
            while (client.FactoryMethod != null)
            {
                callChain.Push(client.FactoryMethod.Signature);
                if (client.ParentClient == null)
                {
                    break;
                }

                client = client.ParentClient;
            }
            callChain.Push(client.GetEffectiveCtor()!);

            return callChain.ToArray();
        }

        public IEnumerable<ValueExpression> GetValueExpressionsForParameters(IEnumerable<Parameter> parameters, List<MethodBodyStatement> variableDeclarationStatements)
        {
            foreach (var parameter in parameters)
            {
                ValueExpression parameterExpression;
                if (ParameterValueMapping.TryGetValue(parameter.Name, out var exampleValue))
                {
                    // if we could get an example value out of the map, we just use it.
                    parameterExpression = ExampleValueSnippets.GetExpression(exampleValue, parameter.SerializationFormat);
                }
                else
                {
                    // if we cannot get an example value out of the map, we should skip it, unless it is required
                    // in the required case, we should return the default value of the type.
                    // but we should not abuse `default` because it might cause ambiguous calls which leads to compilation errors
                    if (parameter.IsOptionalInSignature)
                        continue;

                    parameterExpression = parameter.Type.IsValueType && !parameter.Type.IsNullable ? Default.CastTo(parameter.Type) : Null.CastTo(parameter.Type);
                }
                if (IsInlineParameter(parameter))
                {
                    yield return parameter.IsOptionalInSignature ? new PositionalParameterReference(parameter.Name, parameterExpression) : parameterExpression;
                }
                else
                {
                    // when it is not inline parameter, we add the declaration of the parameter into the statements, and returns the parameter name reference
                    var parameterReference = new VariableReference(parameter.Type, parameter.Name);
                    var declaration = NeedsDispose(parameter) ? UsingDeclare(parameterReference, parameterExpression) : Declare(parameterReference, parameterExpression);
                    variableDeclarationStatements.Add(declaration);
                    yield return parameter.IsOptionalInSignature ? new PositionalParameterReference(parameter.Name, parameterReference) : parameterReference; // returns the parameter name reference
                }
            }
        }

        private Dictionary<string, InputExampleParameterValue>? _parameterValueMapping;
        public Dictionary<string, InputExampleParameterValue> ParameterValueMapping => _parameterValueMapping ??= EnsureParameterValueMapping();

        private Dictionary<string, InputExampleParameterValue> EnsureParameterValueMapping()
        {
            var result = new Dictionary<string, InputExampleParameterValue>();
            var parameters = GetAllParameters();
            var parameterExamples = GetAllParameterExamples();

            foreach (var parameter in parameters)
            {
                if (ProcessKnownParameters(result, parameter))
                    continue;
                // find the corresponding input parameter
                var exampleValue = FindExampleValueBySerializedName(parameterExamples, parameter.Name);

                if (exampleValue == null)
                {
                    // if this is a required parameter and we did not find the corresponding parameter in the examples, we put the null
                    if (!parameter.IsOptionalInSignature)
                    {
                        result.Add(parameter.Name, new InputExampleParameterValue(parameter, Null.CastTo(parameter.Type)));
                    }
                    // if it is optional, we just do not put it in the map indicates that in the invocation we could omit it
                }
                else
                {
                    // add it into the mapping
                    result.Add(parameter.Name, new InputExampleParameterValue(parameter, exampleValue));
                }
            }

            return result;
        }

        /// <summary>
        /// Returns all the parameters that should be used in this sample
        /// Only required parameters on this operation will be included if useAllParameters is false
        /// Includes all parameters if useAllParameters is true
        /// </summary>
        /// <returns></returns>
        private IEnumerable<Parameter> GetAllParameters()
        {
            // here we should gather all the parameters from my client, and my parent client, and the parent client of my parent client, etc
            foreach (var method in ClientInvocationChain)
            {
                foreach (var parameter in method.Parameters)
                    yield return parameter;
            }
            // then we return all the parameters on this operation
            var parameters = IsAllParametersUsed ?
                _operationMethodSignature.Parameters :
                _operationMethodSignature.Parameters.Where(p => !p.IsOptionalInSignature);
            foreach (var parameter in parameters)
                yield return parameter;
        }

        /// <summary>
        /// This method returns all the related parameter examples on this particular method. For examples whose parameters
        /// are of type InputModelType, we will try to find the corresponding type and use the CSharpType name instead of the parameter name.
        /// </summary>
        /// <returns>
        /// A list of parameter examples.
        /// </returns>
        private IEnumerable<InputParameterExample> GetAllParameterExamples()
        {
            // first we return all the client parameters for reference
            foreach (var parameter in _inputClientParameterExamples)
                yield return parameter;
            foreach (var parameter in _inputOperationExample.Parameters)
            {
                var inputParameter = parameter.Parameter;
                var inputParameterName = inputParameter.Name;

                if (inputParameter.Type is InputModelType model && inputParameterName.Equals(inputParameter.Type.Name))
                {
                    var type = _typeFactory.CreateType(model);
                    if (type != null)
                    {
                        yield return parameter with { Parameter = inputParameter with { Name = type.Name } };
                    }
                }

                yield return parameter;
            }
        }

        private bool ProcessKnownParameters(Dictionary<string, InputExampleParameterValue> result, Parameter parameter)
        {
            if (parameter == KnownParameters.WaitForCompletion)
            {
                result.Add(parameter.Name, new InputExampleParameterValue(parameter, new TypeReference(typeof(WaitUntil)).Property(nameof(WaitUntil.Completed))));
                return true;
            }

            if (parameter == KnownParameters.CancellationTokenParameter)
            {
                // we usually do not set this parameter in generated test cases
                return true;
            }

            if (parameter == KnownParameters.RequestContextRequired)
            {
                // we need the RequestContext to disambiguiate from the convenience method - but passing in a null value is allowed.
                result.Add(parameter.Name, new InputExampleParameterValue(parameter, Null.CastTo(parameter.Type)));
                return true;
            }

            // endpoint we kind of will change its description therefore here we only find it for name and type
            if (IsSameParameter(parameter, KnownParameters.Endpoint))
            {
                result.Add(parameter.Name, new InputExampleParameterValue(parameter, GetEndpointValue(parameter.Name)));
                return true;
            }

            // request content is also special
            if (IsSameParameter(parameter, KnownParameters.RequestContent) || IsSameParameter(parameter, KnownParameters.RequestContentNullable))
            {
                result.Add(parameter.Name, new InputExampleParameterValue(parameter, GetBodyParameterValue()));
                return true;
            }

            if (IsSameParameter(parameter, KnownParameters.RequestConditionsParameter) || IsSameParameter(parameter, KnownParameters.MatchConditionsParameter))
            {
                // temporarily just return null value
                result.Add(parameter.Name, new InputExampleParameterValue(parameter, Null.CastTo(parameter.Type)));
                return true;
            }

            // handle credentials
            if (parameter.Type.EqualsIgnoreNullable(KnownParameters.KeyAuth.Type))
            {
                result.Add(parameter.Name, new InputExampleParameterValue(parameter, New.Instance(Configuration.ApiTypes.KeyCredentialType, Configuration.ApiTypes.GetKeySampleExpression(_client.TopLevelClient.Type.Name))));
                return true;
            }

            if (parameter.Type.EqualsIgnoreNullable(KnownParameters.TokenAuth.Type))
            {
                result.Add(parameter.Name, new InputExampleParameterValue(parameter, new FormattableStringToExpression($"new DefaultAzureCredential()"))); // TODO -- we have to workaround here because we do not have the Azure.Identity dependency here
                return true;
            }

            return false;
        }

        protected InputExampleValue? FindExampleValueBySerializedName(IEnumerable<InputParameterExample> parameterExamples, string name)
        {
            foreach (var parameterExample in parameterExamples)
            {
                var parameter = parameterExample.Parameter;
                // TODO -- we might need to refactor this when we finally separate protocol method and convenience method from the LowLevelClientMethod class
                if (parameter.Kind == InputOperationParameterKind.Spread)
                {
                    // when it is a spread parameter, it should always be InputModelType
                    var modelType = parameter.Type as InputModelType;
                    var objectExampleValue = parameterExample.ExampleValue as InputExampleObjectValue;
                    Debug.Assert(modelType != null);
                    Debug.Assert(objectExampleValue != null);

                    foreach (var modelOrBase in modelType.GetSelfAndBaseModels())
                    {
                        foreach (var property in modelOrBase.Properties)
                        {
                            if (property.Name.ToVariableName() == name)
                            {
                                return objectExampleValue.Values[property.SerializedName];
                            }
                        }
                    }
                }
                else
                {
                    if (parameter.Name.ToVariableName() == name)
                    {
                        return parameterExample.ExampleValue;
                    }
                }
            }
            return null;
        }

        public InputExampleValue GetEndpointValue(string parameterName)
        {
            var clientParameterValue = _inputClientParameterExamples.FirstOrDefault(e => e.Parameter.IsEndpoint)?.ExampleValue;
            if (clientParameterValue != null)
                return clientParameterValue;

            var operationParameterValue = _inputOperationExample.Parameters.FirstOrDefault(e => e.Parameter.IsEndpoint)?.ExampleValue;
            if (operationParameterValue != null)
                return operationParameterValue;

            // sometimes, especially in swagger projects, the parameter used as endpoint in our client, does not have the `IsEndpoint` flag, we have to fallback here so that we could at least have a value for it.
            return InputExampleValue.Value(InputPrimitiveType.String, $"<{parameterName}>");
        }

        private bool NeedsDispose(Parameter parameter)
        {
            if (IsSameParameter(parameter, KnownParameters.RequestContent) || IsSameParameter(parameter, KnownParameters.RequestContentNullable))
                return true;

            return false;
        }

        private bool IsInlineParameter(Parameter parameter)
        {
            if (IsSameParameter(parameter, KnownParameters.RequestContent) || IsSameParameter(parameter, KnownParameters.RequestContentNullable))
                return false;

            if (IsSameParameter(parameter, KnownParameters.Endpoint))
                return false;

            if (parameter.Type.EqualsIgnoreNullable(KnownParameters.KeyAuth.Type))
                return false;

            if (parameter.Type.EqualsIgnoreNullable(KnownParameters.TokenAuth.Type))
                return false;

            if (parameter.Type is { IsFrameworkType: false, Implementation: ObjectType })
                return false;

            return true;
        }

        private InputExampleValue GetBodyParameterValue()
        {
            // we have a request body type
            if (_method.RequestBodyType == null)
                return InputExampleValue.Null(InputPrimitiveType.Object);

            //if (Method.RequestBodyType is InputPrimitiveType { Kind: InputTypeKind.Stream })
            //    return InputExampleValue.Stream(Method.RequestBodyType, "<filePath>");

            // find the example value for this type
            // if there is only one parameter is body parameter, we return it.
            var bodyParameters = _inputOperationExample.Parameters.Where(e => e.Parameter is { Location: RequestLocation.Body }).ToArray();
            if (bodyParameters.Length == 1)
            {
                return bodyParameters.Single().ExampleValue;
            }
            // there could be multiple body parameters especially when we have a multiform content type operation
            // if we have more than one body parameters which should happen very rarely, we just search the type in all parameters we have and get the first one that matches.
            var bodyParameterExample = _inputOperationExample.Parameters.FirstOrDefault(e => e.Parameter.Type == _method.RequestBodyType);
            if (bodyParameterExample != null)
            {
                return bodyParameterExample.ExampleValue;
            }

            return InputExampleValue.Null(_method.RequestBodyType);
        }

        private static bool IsSameParameter(Parameter parameter, Parameter knownParameter)
            => parameter.Name == knownParameter.Name && parameter.Type.EqualsIgnoreNullable(knownParameter.Type);

        public bool HasResponseBody => _method.ResponseBodyType != null;
        public bool IsResponseStream => _method.ResponseBodyType is InputPrimitiveType { Kind: InputTypeKind.Stream };

        private InputType? _resultType;
        public InputType? ResultType => _resultType ??= GetEffectiveResponseType();

        /// <summary>
        /// This method returns the Type we would like to deal with in the sample code.
        /// For normal operation and long running operation, it is just the InputType of the response
        /// For pageable operation, it is the InputType of the item
        /// </summary>
        /// <returns></returns>
        private InputType? GetEffectiveResponseType()
        {
            var responseType = _method.ResponseBodyType;
            if (_method.PagingInfo == null)
                return responseType;

            var pagingItemName = _method.PagingInfo.ItemName;
            var listResultType = responseType as InputModelType;
            var itemsArrayProperty = listResultType?.Properties.FirstOrDefault(p => p.SerializedName == pagingItemName && p.Type is InputListType);
            return (itemsArrayProperty?.Type as InputListType)?.ElementType;
        }

        // TODO -- this needs a refactor when we consolidate things around customization code https://github.com/Azure/autorest.csharp/issues/3370
        public static bool ShouldGenerateShortVersion(LowLevelClient client, LowLevelClientMethod method)
        {
            if (method.ConvenienceMethod is not null)
            {
                if (method.ConvenienceMethod.Signature.Parameters.Count == method.ProtocolMethodSignature.Parameters.Count - 1 &&
                    !method.ConvenienceMethod.Signature.Parameters.Last().Type.Equals(typeof(CancellationToken)))
                {
                    bool allEqual = true;
                    for (int i = 0; i < method.ConvenienceMethod.Signature.Parameters.Count; i++)
                    {
                        if (!method.ConvenienceMethod.Signature.Parameters[i].Type.Equals(method.ProtocolMethodSignature.Parameters[i].Type))
                        {
                            allEqual = false;
                            break;
                        }
                    }
                    if (allEqual)
                    {
                        return false;
                    }
                }
            }
            else
            {
                if (client.HasMatchingCustomMethod(method))
                    return false;
            }

            return true;
        }

        public static bool ShouldGenerateSample(LowLevelClient client, MethodSignature protocolMethodSignature)
        {
            return protocolMethodSignature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                !protocolMethodSignature.Attributes.Any(a => a.Type.Equals(typeof(ObsoleteAttribute))) &&
                !client.IsMethodSuppressed(protocolMethodSignature) &&
                (client.IsSubClient ? true : client.GetEffectiveCtor() is not null);
        }

        public string GetSampleInformation(bool isAsync) => IsConvenienceSample
                ? GetSampleInformationForConvenience(_method.ConvenienceMethod!.Signature.WithAsync(isAsync))
                : GetSampleInformationForProtocol(_method.ProtocolMethodSignature.WithAsync(isAsync));

        private string GetSampleInformationForConvenience(MethodSignature methodSignature)
        {
            var methodName = methodSignature.Name;
            if (IsAllParametersUsed)
            {
                return $"This sample shows how to call {methodName} with all parameters.";
            }

            return $"This sample shows how to call {methodName}.";
        }

        private string GetSampleInformationForProtocol(MethodSignature methodSignature)
        {
            var methodName = methodSignature.Name;
            if (IsAllParametersUsed)
            {
                return $"This sample shows how to call {methodName} with all {GenerateParameterAndRequestContentDescription(methodSignature.Parameters)}{(HasResponseBody ? " and parse the result" : "")}.";
            }

            return $"This sample shows how to call {methodName}{(HasResponseBody ? " and parse the result" : string.Empty)}.";
        }

        // RequestContext is excluded
        private static bool HasNonBodyCustomParameter(IReadOnlyList<Parameter> parameters)
            => parameters.Any(p => p.RequestLocation != RequestLocation.Body && !p.Equals(KnownParameters.RequestContext));

        private string GenerateParameterAndRequestContentDescription(IReadOnlyList<Parameter> parameters)
        {
            var hasNonBodyParameter = HasNonBodyCustomParameter(parameters);
            var hasBodyParameter = parameters.Any(p => p.RequestLocation == RequestLocation.Body);

            if (hasNonBodyParameter)
            {
                if (hasBodyParameter)
                {
                    return "parameters and request content";
                }
                return "parameters";
            }
            return "request content";
        }

        private string GetDebuggerDisplay()
            => $"Sample (Client: {_client.Type}, Method: {_operationMethodSignature.GetCRef()})";
    }
}
