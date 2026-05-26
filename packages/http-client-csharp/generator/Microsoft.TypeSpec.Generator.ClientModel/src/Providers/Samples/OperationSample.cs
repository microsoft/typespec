// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers.Samples
{
    /// <summary>
    /// Represents a single sample for an operation — the bridge between an
    /// <see cref="InputOperationExample"/> and the generated C# sample method.
    /// Resolves client construction chains, parameter value mappings, and method invocation details.
    /// Modeled after the autorest DpgOperationSample pattern.
    /// </summary>
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public class OperationSample
    {
        private readonly ClientProvider _client;
        private readonly ScmMethodProviderCollection _methodCollection;
        private readonly InputServiceMethod _serviceMethod;
        private readonly InputOperationExample _example;
        private readonly MethodSignature _operationMethodSignature;

        private IReadOnlyList<MethodSignatureBase>? _clientInvocationChain;
        private Dictionary<string, ExampleParameterValue>? _parameterValueMapping;
        private InputType? _resultType;

        public OperationSample(
            ClientProvider client,
            ScmMethodProviderCollection methodCollection,
            InputServiceMethod serviceMethod,
            InputOperationExample example,
            bool isConvenienceSample,
            string exampleKey)
        {
            _client = client;
            _methodCollection = methodCollection;
            _serviceMethod = serviceMethod;
            _example = example;
            IsConvenienceSample = isConvenienceSample;
            ExampleKey = exampleKey;
            IsAllParametersUsed = exampleKey == "AllParameters";
            _operationMethodSignature = ResolveOperationSignature();
        }

        // -------------------------------------------------------------------
        // Core identity
        // -------------------------------------------------------------------

        /// <summary>
        /// The example key, e.g. "ShortVersion" or "AllParameters".
        /// </summary>
        public string ExampleKey { get; }

        /// <summary>
        /// Whether this is a convenience method sample (true) or protocol method sample (false).
        /// </summary>
        public bool IsConvenienceSample { get; }

        /// <summary>
        /// Whether this sample uses all parameters (including optional).
        /// </summary>
        public bool IsAllParametersUsed { get; }

        // -------------------------------------------------------------------
        // Method info
        // -------------------------------------------------------------------

        /// <summary>
        /// The input operation name.
        /// </summary>
        public string InputOperationName => _serviceMethod.Operation.Name;

        /// <summary>
        /// The resource name from the operation, or the client name as fallback.
        /// Used for method naming.
        /// </summary>
        public string? ResourceName => _serviceMethod.Operation.ResourceName ?? _client.InputClient.Name;

        /// <summary>
        /// Whether the operation uses paging.
        /// </summary>
        public bool IsPageable => _serviceMethod is InputPagingServiceMethod;

        /// <summary>
        /// Whether the operation is long-running.
        /// </summary>
        public bool IsLongRunning => _serviceMethod is InputLongRunningServiceMethod;

        /// <summary>
        /// The method signature for the operation being sampled (protocol or convenience).
        /// </summary>
        public MethodSignature OperationMethodSignature => _operationMethodSignature;

        /// <summary>
        /// Whether there is a response body on the operation.
        /// </summary>
        public bool HasResponseBody => _serviceMethod.Response?.Type != null;

        /// <summary>
        /// Whether the response is a stream.
        /// </summary>
        public bool IsResponseStream =>
            _serviceMethod.Response?.Type is InputPrimitiveType { Kind: InputPrimitiveTypeKind.Stream };

        /// <summary>
        /// The effective result type of the operation.
        /// For paging, this is the item type; for all others this is the response type.
        /// </summary>
        public InputType? ResultType => _resultType ??= GetEffectiveResponseType();

        private MethodSignature ResolveOperationSignature()
        {
            var kind = IsConvenienceSample ? ScmMethodKind.Convenience : ScmMethodKind.Protocol;
            var method = _methodCollection.MethodProviders
                .FirstOrDefault(m => m.Kind == kind && !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async));
            return method?.Signature ?? _methodCollection.MethodProviders.First().Signature;
        }

        // -------------------------------------------------------------------
        // Client invocation chain
        // -------------------------------------------------------------------

        /// <summary>
        /// Ordered list of method signatures to invoke to construct the client:
        /// [root ctor, .GetSubClient(), .GetLeafClient()].
        /// </summary>
        public IReadOnlyList<MethodSignatureBase> ClientInvocationChain =>
            _clientInvocationChain ??= BuildClientInvocationChain();

        /// <summary>
        /// Walks from the current client up to the root, collecting factory methods,
        /// then pushes the root constructor. Returns the chain in top-down order.
        /// </summary>
        private IReadOnlyList<MethodSignatureBase> BuildClientInvocationChain()
        {
            var callChain = new Stack<MethodSignatureBase>();

            // Walk from the current client up to root, collecting factory methods.
            // For each client that has a parent, find the factory method on the parent
            // that returns it, and push that onto the chain.
            var currentInputClient = _client.InputClient;
            while (currentInputClient.Parent != null)
            {
                var parentProvider = ResolveClientProvider(currentInputClient.Parent);
                if (parentProvider != null)
                {
                    var factoryMethod = FindSubClientFactoryMethod(parentProvider, currentInputClient.Name);
                    if (factoryMethod != null)
                    {
                        callChain.Push(factoryMethod);
                    }
                }
                currentInputClient = currentInputClient.Parent;
            }

            // At the root, push the primary public constructor
            var rootProvider = ResolveClientProvider(currentInputClient);
            if (rootProvider != null)
            {
                var ctor = GetPrimaryPublicConstructor(rootProvider);
                if (ctor != null)
                {
                    callChain.Push(ctor);
                }
            }

            return callChain.ToArray();
        }

        private static ClientProvider? ResolveClientProvider(InputClient inputClient)
        {
            return ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
        }

        private static MethodSignature? FindSubClientFactoryMethod(ClientProvider parentProvider, string subClientName)
        {
            // Match the naming convention used by ClientProvider:
            // If name ends with "Client" → "Get{name}", otherwise → "Get{name}Client"
            var expectedMethodName = subClientName.EndsWith("Client", StringComparison.OrdinalIgnoreCase)
                ? $"Get{subClientName}"
                : $"Get{subClientName}Client";

            foreach (var method in parentProvider.Methods)
            {
                if (method.Signature.Name.Equals(expectedMethodName, StringComparison.OrdinalIgnoreCase) &&
                    !method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async))
                {
                    return method.Signature;
                }
            }
            return null;
        }

        private static ConstructorSignature? GetPrimaryPublicConstructor(ClientProvider clientProvider)
        {
            ConstructorSignature? best = null;
            foreach (var ctor in clientProvider.Constructors)
            {
                if (ctor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public))
                {
                    if (best == null || ctor.Signature.Parameters.Count > best.Parameters.Count)
                    {
                        best = ctor.Signature;
                    }
                }
            }
            return best;
        }

        // -------------------------------------------------------------------
        // Parameter value mapping
        // -------------------------------------------------------------------

        /// <summary>
        /// Maps parameter names to their example values (either pre-built expressions or raw data).
        /// </summary>
        public IReadOnlyDictionary<string, ExampleParameterValue> ParameterValueMapping =>
            _parameterValueMapping ??= EnsureParameterValueMapping();

        private Dictionary<string, ExampleParameterValue> EnsureParameterValueMapping()
        {
            var result = new Dictionary<string, ExampleParameterValue>();
            var parameters = GetAllParameters();
            var parameterExamples = GetAllParameterExamples();

            foreach (var parameter in parameters)
            {
                if (result.ContainsKey(parameter.Name))
                    continue;

                if (TryProcessKnownParameter(result, parameter))
                    continue;

                // Find the corresponding example value
                var exampleValue = FindExampleValueByName(parameterExamples, parameter.Name);

                if (exampleValue == null && parameter.WireInfo?.SerializedName != null)
                {
                    exampleValue = FindExampleValueByName(parameterExamples, parameter.WireInfo.SerializedName);
                }

                if (exampleValue != null)
                {
                    result.Add(parameter.Name, new ExampleParameterValue(parameter.Name, parameter.Type, exampleValue));
                }
                else if (parameter.DefaultValue == null)
                {
                    // Required parameter with no example — use default
                    var expression = DefaultOf(parameter.Type);
                    result.Add(parameter.Name, new ExampleParameterValue(parameter.Name, parameter.Type, expression));
                }
                // Optional parameters with no value are intentionally omitted
            }

            return result;
        }

        /// <summary>
        /// Known parameters that receive special handling (endpoint, credentials, cancellation, etc).
        /// </summary>
        private bool TryProcessKnownParameter(Dictionary<string, ExampleParameterValue> result, ParameterProvider parameter)
        {
            var type = parameter.Type;

            // WaitUntil — prefer Completed to make long-running samples deterministic.
            if (type.Name == "WaitUntil")
            {
                result[parameter.Name] = new ExampleParameterValue(
                    parameter.Name,
                    type,
                    Static(type).Property("Completed"));
                return true;
            }

            // CancellationToken — skip entirely (we don't set it in samples)
            if (parameter.Equals(ScmKnownParameters.CancellationToken))
            {
                return true;
            }

            // RequestOptions (required) — pass null explicitly to avoid ambiguity, similar
            // to old RequestContextRequired handling in AutoRest.
            if ((parameter.Equals(ScmKnownParameters.RequestOptions) || parameter.Equals(ScmKnownParameters.OptionalRequestOptions)) &&
                parameter.DefaultValue == null)
            {
                result[parameter.Name] = new ExampleParameterValue(
                    parameter.Name,
                    type,
                    Null.CastTo(type));
                return true;
            }

            if (type.Equals(typeof(Uri)) && parameter.Name.Equals("endpoint", StringComparison.OrdinalIgnoreCase))
            {
                var endpointExpr = GetEndpointValue(parameter.Name);
                result[parameter.Name] = new ExampleParameterValue(parameter.Name, type, endpointExpr);
                return true;
            }

            // Request content (BinaryContent) — handled specially via body parameter lookup
            if (parameter.IsContentParameter)
            {
                result[parameter.Name] = new ExampleParameterValue(parameter.Name, type, GetBodyParameterValue());
                return true;
            }

            // Request conditions / match conditions — default to null in samples.
            if (type.Name == "RequestConditions" ||
                type.Name == "MatchConditions" ||
                type.Equals(ScmCodeModelGenerator.Instance.TypeFactory.MatchConditionsType))
            {
                result[parameter.Name] = new ExampleParameterValue(
                    parameter.Name,
                    type,
                    Null.CastTo(type));
                return true;
            }

            // ApiKeyCredential — produce `new ApiKeyCredential("<key>")`
            var keyCredentialType = ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.KeyCredentialType;
            if (keyCredentialType != null && (type.Equals(keyCredentialType) || type.Name == keyCredentialType.Name))
            {
                result[parameter.Name] = new ExampleParameterValue(
                    parameter.Name, type, New.Instance(type, Literal("<key>")));
                return true;
            }

            // TokenCredential — produce `new DefaultAzureCredential()`
            // TokenCredential is abstract, so we must use a concrete type.
            var tokenCredentialType = ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.TokenCredentialType;
            if (tokenCredentialType != null && (type.Equals(tokenCredentialType) || type.Name == tokenCredentialType.Name))
            {
                // Use FormattableStringExpression because DefaultAzureCredential
                // lives in Azure.Identity which the generator doesn't reference.
                result[parameter.Name] = new ExampleParameterValue(
                    parameter.Name, type, new FormattableStringExpression("new DefaultAzureCredential()", []));
                return true;
            }

            // ClientOptions — skip (optional, not needed in sample).
            // ScmKnownParameters.ClientOptions sets InitializationValue (not DefaultValue),
            // so we must check both.
            if (parameter.Name.EndsWith("Options", StringComparison.OrdinalIgnoreCase) &&
                (parameter.DefaultValue != null || parameter.InitializationValue != null))
            {
                return true;
            }

            return false;
        }

        /// <summary>
        /// Returns all the parameters that should be used in this sample.
        /// Only required parameters are included if <see cref="IsAllParametersUsed"/> is false.
        /// </summary>
        private IEnumerable<ParameterProvider> GetAllParameters()
        {
            // Parameters from the client invocation chain (ctor + factory methods)
            foreach (var method in ClientInvocationChain)
            {
                foreach (var parameter in method.Parameters)
                    yield return parameter;
            }

            // Parameters from the operation method itself
            var operationParams = IsAllParametersUsed
                ? _operationMethodSignature.Parameters
                : _operationMethodSignature.Parameters.Where(p => p.DefaultValue == null);

            foreach (var parameter in operationParams)
                yield return parameter;
        }

        /// <summary>
        /// Returns all parameter examples, handling spread parameters by extracting
        /// individual properties from the model type.
        /// </summary>
        private IEnumerable<InputParameterExample> GetAllParameterExamples()
        {
            foreach (var parameterExample in _example.Parameters)
            {
                var inputParameter = parameterExample.Parameter;

                // For spread parameters, the example value contains properties of the model
                if (inputParameter is InputMethodParameter { Scope: InputParameterScope.Spread } &&
                    inputParameter.Type is InputModelType modelType &&
                    parameterExample.ExampleValue is InputExampleObjectValue objectValue)
                {
                    var properties = objectValue.Values;
                    foreach (var modelOrBase in GetSelfAndBaseModels(modelType))
                    {
                        foreach (var property in modelOrBase.Properties)
                        {
                            if (properties.TryGetValue(property.SerializedName, out var propValue))
                            {
                                // Create a synthetic parameter example for each spread property
                                var syntheticParam = new InputMethodParameter(
                                    property.Name,
                                    null, // summary
                                    property.Doc,
                                    property.Type,
                                    property.IsRequired,
                                    property.IsReadOnly,
                                    null, // access
                                    property.SerializedName,
                                    false, // isApiVersion
                                    null, // defaultValue
                                    InputParameterScope.Method,
                                    InputRequestLocation.Body);
                                yield return new InputParameterExample(syntheticParam, propValue);
                            }
                        }
                    }
                }
                else
                {
                    yield return parameterExample;
                }
            }
        }

        /// <summary>
        /// Searches for an example value by parameter name (case-sensitive).
        /// </summary>
        private static InputExampleValue? FindExampleValueByName(
            IEnumerable<InputParameterExample> parameterExamples,
            string name)
        {
            foreach (var parameterExample in parameterExamples)
            {
                if (parameterExample.Parameter.Name == name)
                {
                    return parameterExample.ExampleValue;
                }
            }
            return null;
        }

        /// <summary>
        /// Gets the endpoint value, preferring the example value if available.
        /// </summary>
        private InputExampleValue GetEndpointValue(string parameterName)
        {
            // Try to find an endpoint value from the examples
            var endpointExampleValue = _example.Parameters
                .FirstOrDefault(e => e.Parameter is InputEndpointParameter)?.ExampleValue;

            if (endpointExampleValue != null)
                return endpointExampleValue;

            // Fallback: placeholder
            return InputExampleValue.Value(InputPrimitiveType.String, $"<{parameterName}>");
        }

        /// <summary>
        /// Gets the body parameter value from the examples.
        /// If there's a single body parameter example, use it. Otherwise search by type.
        /// </summary>
        private InputExampleValue GetBodyParameterValue()
        {
            var bodyParameters = _example.Parameters
                .Where(e => e.Parameter is InputBodyParameter)
                .ToArray();

            if (bodyParameters.Length == 1)
            {
                return bodyParameters[0].ExampleValue;
            }

            // Check for any body-located method parameter
            var bodyMethodParam = _example.Parameters
                .FirstOrDefault(e => e.Parameter is InputMethodParameter { Location: InputRequestLocation.Body });

            if (bodyMethodParam != null)
            {
                return bodyMethodParam.ExampleValue;
            }

            return InputExampleValue.Null(InputPrimitiveType.Any);
        }

        /// <summary>
        /// Walks the model and all its base models.
        /// </summary>
        private static IEnumerable<InputModelType> GetSelfAndBaseModels(InputModelType model)
        {
            var current = model;
            while (current != null)
            {
                yield return current;
                current = current.BaseModel;
            }
        }

        // -------------------------------------------------------------------
        // Expression generation
        // -------------------------------------------------------------------

        /// <summary>
        /// Converts the parameter value mapping entries to <see cref="ValueExpression"/> instances
        /// for a specific set of parameters. Complex types are declared as out-of-line variables,
        /// while simple types are inlined directly.
        /// </summary>
        public IEnumerable<ValueExpression> GetValueExpressionsForParameters(
            IEnumerable<ParameterProvider> parameters,
            List<MethodBodyStatement> variableDeclarationStatements)
        {
            foreach (var parameter in parameters)
            {
                // Skip ClientOptions-like parameters that should be omitted from samples.
                // These have an InitializationValue (e.g. `options ??= new ClientOptions()`) but
                // are optional and should not appear in sample code. We check before the mapping
                // lookup because the mapping is keyed by name and a different parameter with the
                // same name (e.g. the operation's RequestOptions "options") may exist in the map.
                if (parameter.Name.EndsWith("Options", StringComparison.OrdinalIgnoreCase) &&
                    (parameter.DefaultValue != null || parameter.InitializationValue != null))
                    continue;

                ValueExpression parameterExpression;

                if (ParameterValueMapping.TryGetValue(parameter.Name, out var exampleValue))
                {
                    var format = parameter.WireInfo?.SerializationFormat ?? SerializationFormat.Default;
                    parameterExpression = ExampleValueExpressionBuilder.GetExpression(exampleValue, format);
                }
                else
                {
                    // No example value — skip optional parameters (those with defaults or initialization values)
                    if (parameter.DefaultValue != null || parameter.InitializationValue != null)
                        continue;

                    parameterExpression = DefaultOf(parameter.Type);
                }

                if (IsInlineParameter(parameter))
                {
                    yield return parameterExpression;
                }
                else
                {
                    // Declare variable out-of-line
                    var varRef = new VariableExpression(parameter.Type, parameter.Name);
                    var declaration = NeedsDispose(parameter)
                        ? UsingDeclare(varRef, parameterExpression)
                        : Declare(varRef, parameterExpression);
                    variableDeclarationStatements.Add(declaration);
                    yield return varRef;
                }
            }
        }

        /// <summary>
        /// Determines whether a parameter value should be inlined directly in the method call
        /// or declared as a separate variable.
        /// </summary>
        private static bool IsInlineParameter(ParameterProvider parameter)
        {
            var type = parameter.Type;

            // Content parameters (BinaryContent/RequestContent) → out-of-line
            if (parameter.IsContentParameter)
                return false;

            // Endpoint → out-of-line
            if (type.Equals(typeof(Uri)))
                return false;

            // Credentials → out-of-line
            var keyCredentialType = ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.KeyCredentialType;
            var tokenCredentialType = ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.TokenCredentialType;
            if ((keyCredentialType != null && (type.Equals(keyCredentialType) || type.Name == keyCredentialType.Name)) ||
                (tokenCredentialType != null && (type.Equals(tokenCredentialType) || type.Name == tokenCredentialType.Name)))
                return false;

            // Model types (non-framework, non-enum, non-collection) → out-of-line
            if (!type.IsFrameworkType && !type.IsEnum && !type.IsList && !type.IsDictionary)
                return false;

            // Everything else (primitives, enums, collections) → inline
            return true;
        }

        /// <summary>
        /// Determines whether a parameter needs a using declaration for disposal.
        /// </summary>
        private static bool NeedsDispose(ParameterProvider parameter)
        {
            return parameter.IsContentParameter;
        }

        // -------------------------------------------------------------------
        // Response type resolution
        // -------------------------------------------------------------------

        /// <summary>
        /// Returns the effective response type.
        /// For paging operations, unwraps the item type from the response model.
        /// For non-paging operations, returns the response type directly.
        /// </summary>
        private InputType? GetEffectiveResponseType()
        {
            var responseType = _serviceMethod.Response?.Type;

            if (_serviceMethod is not InputPagingServiceMethod pagingMethod)
                return responseType;

            // For paging, try to unwrap the item type from the response model
            var itemSegments = pagingMethod.PagingMetadata.ItemPropertySegments;
            if (itemSegments.Count == 0 || responseType is not InputModelType responseModel)
                return responseType;

            // Walk the item property path to find the items array
            InputType currentType = responseModel;
            foreach (var segment in itemSegments)
            {
                if (currentType is not InputModelType currentModel)
                    break;

                var property = currentModel.Properties
                    .FirstOrDefault(p => p.SerializedName == segment || p.Name == segment);
                if (property == null)
                    break;

                currentType = property.Type;
            }

            // If we found an array type at the end of the path, return the element type
            if (currentType is InputArrayType arrayType)
                return arrayType.ValueType;

            return responseType;
        }

        // -------------------------------------------------------------------
        // Static helpers for sample generation decisions
        // -------------------------------------------------------------------

        /// <summary>
        /// Determines whether samples should be generated for the given method.
        /// </summary>
        public static bool ShouldGenerateSample(ClientProvider client, MethodSignature protocolSignature)
        {
            if (!protocolSignature.Modifiers.HasFlag(MethodSignatureModifiers.Public))
                return false;

            // Check for obsolete
            if (protocolSignature.Attributes.Any(a => a.Type.Equals(typeof(ObsoleteAttribute))))
                return false;

            // Subclients are always valid; root clients need a public constructor
            bool isSubClient = client.InputClient.Parent != null;
            if (isSubClient)
                return true;

            return client.Constructors.Any(c =>
                c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
        }

        /// <summary>
        /// Determines whether the ShortVersion sample should be generated.
        /// If protocol and convenience signatures are effectively identical, skip ShortVersion for protocol
        /// to avoid duplicate samples.
        /// </summary>
        public static bool ShouldGenerateShortVersion(ScmMethodProviderCollection methodCollection)
        {
            var protocolMethod = methodCollection.MethodProviders
                .FirstOrDefault(m => m.Kind == ScmMethodKind.Protocol &&
                    !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async));
            var convenienceMethod = methodCollection.MethodProviders
                .FirstOrDefault(m => m.Kind == ScmMethodKind.Convenience &&
                    !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async));

            if (protocolMethod == null || convenienceMethod == null)
                return true;

            var protocolParams = protocolMethod.Signature.Parameters;
            var convenienceParams = convenienceMethod.Signature.Parameters;

            // If the convenience method has one fewer parameter (e.g., no CancellationToken)
            // and all overlapping parameter types match, skip — they're effectively identical.
            if (convenienceParams.Count == protocolParams.Count - 1 && convenienceParams.Count > 0 &&
                !convenienceParams.Last().Type.Equals(typeof(CancellationToken)))
            {
                bool allEqual = true;
                for (int i = 0; i < convenienceParams.Count; i++)
                {
                    if (!convenienceParams[i].Type.Equals(protocolParams[i].Type))
                    {
                        allEqual = false;
                        break;
                    }
                }

                if (allEqual)
                    return false;
            }

            return true;
        }

        // -------------------------------------------------------------------
        // Sample information (human-readable descriptions)
        // -------------------------------------------------------------------

        /// <summary>
        /// Gets a human-readable description of what the sample demonstrates.
        /// </summary>
        public string GetSampleInformation(bool isAsync)
        {
            var methodName = isAsync
                ? _operationMethodSignature.Name + "Async"
                : _operationMethodSignature.Name;

            return IsConvenienceSample
                ? GetSampleInformationForConvenience(methodName)
                : GetSampleInformationForProtocol(methodName);
        }

        private string GetSampleInformationForConvenience(string methodName)
        {
            if (IsAllParametersUsed)
                return $"This sample shows how to call {methodName} with all parameters.";
            return $"This sample shows how to call {methodName}.";
        }

        private string GetSampleInformationForProtocol(string methodName)
        {
            if (IsAllParametersUsed)
            {
                var desc = GenerateParameterAndRequestContentDescription(_operationMethodSignature.Parameters);
                var parseResult = HasResponseBody ? " and parse the result" : "";
                return $"This sample shows how to call {methodName} with all {desc}{parseResult}.";
            }
            return $"This sample shows how to call {methodName}{(HasResponseBody ? " and parse the result" : "")}.";
        }

        private static string GenerateParameterAndRequestContentDescription(IReadOnlyList<ParameterProvider> parameters)
        {
            var hasNonBodyParameter = parameters.Any(p =>
                p.Location != ParameterLocation.Body && p.Name != "options");
            var hasBodyParameter = parameters.Any(p => p.Location == ParameterLocation.Body);

            if (hasNonBodyParameter)
                return hasBodyParameter ? "parameters and request content" : "parameters";
            return "request content";
        }

        private string GetDebuggerDisplay()
            => $"Sample (Client: {_client.Name}, Method: {_operationMethodSignature.Name})";
    }
}
