// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Input.Examples;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Output.Samples.Models;
using AutoRest.CSharp.Utilities;
using Azure;
using Azure.Core;
using static AutoRest.CSharp.Output.Models.MethodSignatureModifiers;
using Configuration = AutoRest.CSharp.Common.Input.Configuration;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Output.Models
{
    internal class OperationMethodChainBuilder
    {
        private static readonly Dictionary<string, RequestConditionHeaders> ConditionRequestHeader = new(StringComparer.OrdinalIgnoreCase)
        {
            ["If-Match"] = RequestConditionHeaders.IfMatch,
            ["If-None-Match"] = RequestConditionHeaders.IfNoneMatch,
            ["If-Modified-Since"] = RequestConditionHeaders.IfModifiedSince,
            ["If-Unmodified-Since"] = RequestConditionHeaders.IfUnmodifiedSince
        };

        private readonly string _namespaceName;
        private readonly string _clientName;
        private readonly LowLevelClient? _client;
        private readonly ClientFields _fields;
        private readonly IReadOnlyDictionary<string, InputClientExample>? _clientParameterExamples;
        private readonly TypeFactory _typeFactory;
        private readonly SourceInputModel? _sourceInputModel;
        private readonly List<ParameterChain> _orderedParameters;
        private readonly ReturnTypeChain _returnType;
        private readonly List<RequestPartSource> _requestParts;
        private readonly RestClientMethod _restClientMethod;

        private Parameter? _protocolBodyParameter;
        private ProtocolMethodPaging? _protocolMethodPaging;
        private RequestConditionHeaders _conditionHeaderFlag = RequestConditionHeaders.None;

        private InputOperation Operation { get; }

        public OperationMethodChainBuilder(LowLevelClient? client, InputOperation operation, string namespaceName, string clientName, ClientFields fields, TypeFactory typeFactory, SourceInputModel? sourceInputModel, IReadOnlyDictionary<string, InputClientExample>? clientParameterExamples)
        {
            _client = client;
            _namespaceName = namespaceName;
            _clientName = clientName;
            _fields = fields;
            _clientParameterExamples = clientParameterExamples;
            _typeFactory = typeFactory;
            _sourceInputModel = sourceInputModel;
            _orderedParameters = new List<ParameterChain>();
            _requestParts = new List<RequestPartSource>();

            Operation = operation;
            _returnType = BuildReturnTypes();
            BuildParameters();
            _restClientMethod = RestClientBuilder.BuildRequestMethod(Operation, _orderedParameters.Select(p => p.CreateMessage).WhereNotNull().ToArray(), _requestParts, _protocolBodyParameter, _typeFactory);
        }

        public void BuildNextPageMethod(IReadOnlyDictionary<InputOperation, OperationMethodChainBuilder> builders)
        {
            var paging = Operation.Paging;
            if (paging == null)
            {
                return;
            }

            var nextLinkOperation = paging.NextLinkOperation;
            var nextLinkName = paging.NextLinkName;

            RestClientMethod? nextPageMethod = nextLinkOperation != null
                ? builders[nextLinkOperation]._restClientMethod
                : nextLinkName != null
                    ? RestClientBuilder.BuildNextPageMethod(_restClientMethod)
                    : null;

            _protocolMethodPaging = new ProtocolMethodPaging(nextPageMethod, nextLinkName, paging.ItemName ?? "value");
        }

        public LowLevelClientMethod BuildOperationMethodChain()
        {
            var protocolMethodAttributes = Operation.Deprecated is { } deprecated
                ? new[] { new CSharpAttribute(typeof(ObsoleteAttribute), Literal(deprecated)) }
                : Array.Empty<CSharpAttribute>();

            var shouldRequestContextOptional = ShouldRequestContextOptional();
            var protocolMethodParameters = _orderedParameters.Select(p => p.Protocol).WhereNotNull().Select(p => p != KnownParameters.RequestContentNullable && !shouldRequestContextOptional ? p.ToRequired() : p).ToArray();
            var protocolMethodModifiers = (Operation.GenerateProtocolMethod ? _restClientMethod.Accessibility : Internal) | Virtual;
            var protocolMethodSignature = new MethodSignature(_restClientMethod.Name, FormattableStringHelpers.FromString(_restClientMethod.Summary), FormattableStringHelpers.FromString(_restClientMethod.Description), protocolMethodModifiers, _returnType.Protocol, null, protocolMethodParameters, protocolMethodAttributes);
            var convenienceMethodInfo = ShouldGenerateConvenienceMethod();
            var convenienceMethod = BuildConvenienceMethod(shouldRequestContextOptional, convenienceMethodInfo);

            var diagnostic = new Diagnostic($"{_clientName}.{_restClientMethod.Name}");

            var requestBodyType = Operation.Parameters.FirstOrDefault(p => p.Location == RequestLocation.Body)?.Type;
            var responseBodyType = GetReturnedResponseInputType();

            // samples will build below
            var samples = new List<DpgOperationSample>();

            var method = new LowLevelClientMethod(protocolMethodSignature, convenienceMethod, _restClientMethod, requestBodyType, responseBodyType, diagnostic, _protocolMethodPaging, Operation.LongRunning, _conditionHeaderFlag, samples, convenienceMethodInfo.Message, GetLongRunningResultRetrievalMethod(Operation.LongRunning));

            BuildSamples(method, samples);

            return method;
        }

        private void BuildSamples(LowLevelClientMethod method, List<DpgOperationSample> samples)
        {
            // we do not generate any sample if these variables are null
            // they are only null when HLC calling methods in this class
            if (_clientParameterExamples == null || _client == null)
                return;
            var shouldGenerateSample = DpgOperationSample.ShouldGenerateSample(_client, method.ProtocolMethodSignature);

            if (!shouldGenerateSample)
                return;

            // short version samples
            var shouldGenerateShortVersion = DpgOperationSample.ShouldGenerateShortVersion(_client, method);

            foreach (var (exampleKey, clientExample) in _clientParameterExamples)
            {
                if (!shouldGenerateShortVersion && exampleKey != ExampleMockValueBuilder.ShortVersionMockExampleKey)
                    continue; // skip the short example when we decide not to generate it

                if (Operation.Examples.TryGetValue(exampleKey, out var operationExample))
                {
                    // add protocol method sample
                    samples.Add(new(
                        _client,
                        _typeFactory,
                        method,
                        clientExample.ClientParameters,
                        operationExample,
                        false,
                        exampleKey));

                    // add convenience method sample
                    if (method.ConvenienceMethod != null && method.ConvenienceMethod.Signature.Modifiers.HasFlag(Public))
                    {
                        samples.Add(new(
                            _client,
                            _typeFactory,
                            method,
                            clientExample.ClientParameters,
                            operationExample,
                            true,
                            exampleKey));
                    }
                }
            }
        }

        private LongRunningResultRetrievalMethod? GetLongRunningResultRetrievalMethod(OperationLongRunning? longRunning)
        {
            if (longRunning is { ResultPath: not null })
                return new(_typeFactory.CreateType(longRunning.ReturnType!), longRunning.FinalResponse.BodyType!.Name, longRunning.ResultPath);

            return null;
        }

        private ConvenienceMethodGenerationInfo ShouldGenerateConvenienceMethod()
        {
            // we do not generate convenience method if the emitter does not allow it.
            if (!Operation.GenerateConvenienceMethod)
                return new()
                {
                    IsConvenienceMethodGenerated = false
                };

            // if the protocol method is generated and the parameters are the same in protocol and convenience, we do not generate the convenience.
            if (Operation.GenerateProtocolMethod && !IsConvenienceMethodMeaningful())
            {
                return new()
                {
                    Message = ConvenienceMethodOmittingMessage.NotMeaningful,
                    IsConvenienceMethodGenerated = false
                };
            }

            return new()
            {
                IsConvenienceMethodGenerated = true,
                IsConvenienceMethodInternal = false
            };
        }

        // If all the corresponding parameters and return types of convenience method and protocol method have the same type, it does not make sense to generate the convenience method.
        private bool IsConvenienceMethodMeaningful()
        {
            return _orderedParameters.Where(parameter => parameter.Convenience != KnownParameters.CancellationTokenParameter).Any(parameter => !IsParameterTypeSame(parameter.Convenience, parameter.Protocol))
                || !_returnType.Convenience.Equals(_returnType.Protocol);
        }

        private bool HasAmbiguityBetweenProtocolAndConvenience()
        {
            var userDefinedParameters = _orderedParameters.Where(parameter => parameter.Convenience != KnownParameters.CancellationTokenParameter);
            int protocolRequired = userDefinedParameters.Select(p => p.Protocol).WhereNotNull().Where(p => !p.IsOptionalInSignature).Count();
            int convenienceRequired = userDefinedParameters.Select(p => p.Convenience).WhereNotNull().Where(p => !p.IsOptionalInSignature).Count();
            if (protocolRequired != convenienceRequired)
            {
                return false;
            }
            return userDefinedParameters.Where(p => p.Protocol != null && !p.Protocol.IsOptionalInSignature).All(parameter => IsParameterTypeSame(parameter.Convenience, parameter.Protocol));
        }

        private bool ShouldRequestContextOptional()
        {
            if (Configuration.KeepNonOverloadableProtocolSignature || !IsConvenienceMethodMeaningful())
            {
                return true;
            }

            if (_sourceInputModel != null)
            {
                var existingMethod = _sourceInputModel.FindMethod(_namespaceName, _clientName, Operation.CleanName, _orderedParameters.Select(p => p.Protocol).WhereNotNull().Select(p => p.Type));
                if (existingMethod != null && existingMethod.Parameters.Length > 0 && existingMethod.Parameters.Last().IsOptional)
                {
                    return true;
                }
            }

            if (HasAmbiguityBetweenProtocolAndConvenience())
            {
                return false;
            }

            return true;
        }

        private bool IsParameterTypeSame(Parameter? first, Parameter? second)
        {
            return object.Equals(first?.Type, second?.Type);
        }

        private ReturnTypeChain BuildReturnTypes()
        {
            CSharpType? responseType = GetReturnedResponseCSharpType();

            if (Operation.Paging != null)
            {
                if (responseType == null)
                {
                    throw new InvalidOperationException($"Method {Operation.Name} has to have a return value");
                }

                if (responseType is { IsFrameworkType: false, Implementation: ModelTypeProvider modelType })
                {
                    var property = modelType.GetPropertyBySerializedName(Operation.Paging.ItemName ?? "value");
                    var propertyType = property.ValueType.WithNullable(false);
                    if (!TypeFactory.IsList(propertyType))
                    {
                        throw new InvalidOperationException($"'{modelType.Declaration.Name}.{property.Declaration.Name}' property must be a collection of items");
                    }

                    responseType = TypeFactory.GetElementType(property.ValueType);
                }
                else if (TypeFactory.IsList(responseType))
                {
                    responseType = TypeFactory.GetElementType(responseType);
                }

                if (Operation.LongRunning != null)
                {
                    var convenienceMethodReturnType = new CSharpType(typeof(Operation<>), new CSharpType(typeof(Pageable<>), responseType));
                    return new ReturnTypeChain(convenienceMethodReturnType, typeof(Operation<Pageable<BinaryData>>), responseType);
                }

                return new ReturnTypeChain(new CSharpType(typeof(Pageable<>), responseType), typeof(Pageable<BinaryData>), responseType);
            }

            if (Operation.LongRunning != null)
            {
                if (responseType != null)
                {
                    return new ReturnTypeChain(new CSharpType(typeof(Operation<>), responseType), typeof(Operation<BinaryData>), responseType);
                }

                return new ReturnTypeChain(typeof(Operation), typeof(Operation), null);
            }

            var headAsBoolean = Operation.HttpMethod == RequestMethod.Head && Configuration.HeadAsBoolean;
            if (headAsBoolean)
            {
                return new ReturnTypeChain(Configuration.ApiTypes.GetResponseOfT<bool>(), Configuration.ApiTypes.GetResponseOfT<bool>(), null);
            }

            if (responseType != null)
            {
                return new ReturnTypeChain(new CSharpType(Configuration.ApiTypes.ResponseOfTType, responseType), Configuration.ApiTypes.ResponseType, responseType);
            }

            return new ReturnTypeChain(Configuration.ApiTypes.ResponseType, Configuration.ApiTypes.ResponseType, null);
        }

        private CSharpType? GetReturnedResponseCSharpType()
        {
            var inputType = GetReturnedResponseInputType();
            if (inputType != null)
            {
                return TypeFactory.GetOutputType(_typeFactory.CreateType(inputType));
            }
            return null;
        }

        private InputType? GetReturnedResponseInputType()
        {
            if (Operation.LongRunning != null)
            {
                return Operation.LongRunning.ReturnType;
            }

            var operationBodyTypes = Operation.Responses.Where(r => !r.IsErrorResponse).Select(r => r.BodyType).Distinct();
            if (operationBodyTypes.Any())
            {
                return operationBodyTypes.First();
            }

            return null;
        }

        private IReadOnlyList<string>? GetReturnedResponseContentType()
        {
            var responses = Operation.Responses.Where(r => !r.IsErrorResponse);
            return responses.Any() ? responses.First().ContentTypes : null;
        }

        private ConvenienceMethod? BuildConvenienceMethod(bool shouldRequestContextOptional, ConvenienceMethodGenerationInfo generationInfo)
        {
            if (!generationInfo.IsConvenienceMethodGenerated)
                return null;

            bool needNameChange = shouldRequestContextOptional && HasAmbiguityBetweenProtocolAndConvenience();
            string name = _restClientMethod.Name;
            if (needNameChange)
            {
                name = _restClientMethod.Name.IsLastWordSingular() ? $"{_restClientMethod.Name}Value" : $"{_restClientMethod.Name.LastWordToSingular()}Values";
            }
            var attributes = Operation.Deprecated is { } deprecated
                ? new[] { new CSharpAttribute(typeof(ObsoleteAttribute), Literal(deprecated)) }
                : null;

            var protocolToConvenience = new List<ProtocolToConvenienceParameterConverter>();
            var parameterList = new List<Parameter>();
            foreach (var parameterChain in _orderedParameters)
            {
                var protocolParameter = parameterChain.Protocol;
                var convenienceParameter = parameterChain.Convenience;
                if (convenienceParameter != null)
                {
                    if (parameterChain.IsSpreadParameter)
                    {
                        if (convenienceParameter.Type is { IsFrameworkType: false, Implementation: ModelTypeProvider model })
                        {
                            var parameters = BuildSpreadParameters(model).OrderBy(p => p.DefaultValue == null ? 0 : 1);

                            parameterList.AddRange(parameters);
                            protocolToConvenience.Add(new ProtocolToConvenienceParameterConverter(protocolParameter!, convenienceParameter, new ConvenienceParameterSpread(model, parameters)));
                        }
                        else
                        {
                            throw new InvalidOperationException($"The parameter {convenienceParameter.Name} is marked as Spread but its type is not ModelTypeProvider (got {convenienceParameter.Type})");
                        }
                    }
                    else
                    {
                        parameterList.Add(convenienceParameter);
                        if (protocolParameter != null)
                            protocolToConvenience.Add(new ProtocolToConvenienceParameterConverter(protocolParameter, convenienceParameter, null));
                    }
                }
            }
            var accessibility = _restClientMethod.Accessibility | Virtual;
            if (generationInfo.IsConvenienceMethodInternal)
            {
                accessibility &= ~Public; // removes public if any
                accessibility |= Internal; // add internal
            }
            var convenienceSignature = new MethodSignature(name, FormattableStringHelpers.FromString(_restClientMethod.Summary), FormattableStringHelpers.FromString(_restClientMethod.Description), accessibility, _returnType.Convenience, null, parameterList, attributes);
            var diagnostic = name != _restClientMethod.Name ? new Diagnostic($"{_clientName}.{convenienceSignature.Name}") : null;
            return new ConvenienceMethod(convenienceSignature, protocolToConvenience, _returnType.ConvenienceResponseType, Operation.RequestMediaTypes, GetReturnedResponseContentType(), diagnostic, _protocolMethodPaging is not null, Operation.LongRunning is not null, Operation.Deprecated);
        }

        private IEnumerable<Parameter> BuildSpreadParameters(ModelTypeProvider model)
        {
            var fields = model.Fields;
            var addedParameters = new HashSet<string>();
            foreach (var parameter in fields.PublicConstructorParameters)
            {
                addedParameters.Add(parameter.Name);
                yield return parameter;
            }

            foreach (var parameter in fields.SerializationParameters)
            {
                if (addedParameters.Contains(parameter.Name))
                    continue;

                var field = fields.GetFieldByParameterName(parameter.Name);
                var inputProperty = fields.GetInputByField(field);
                if (inputProperty is null)
                    continue; // this means this is an additional properties property, which should never happen.

                if (inputProperty.IsRequired && inputProperty.Type is InputLiteralType)
                    continue;
                var inputType = TypeFactory.GetInputType(parameter.Type).WithNullable(!inputProperty.IsRequired);
                Constant? defaultValue = null;
                if (!inputProperty.IsRequired)
                    defaultValue = Constant.Default(inputType);

                yield return parameter with
                {
                    Type = inputType,
                    DefaultValue = defaultValue,
                };
            }
        }

        private void BuildParameters()
        {
            var operationParameters = RestClientBuilder.FilterOperationAllParameters(Operation.Parameters);

            var requiredPathParameters = new Dictionary<string, InputParameter>();
            var optionalPathParameters = new Dictionary<string, InputParameter>();
            var requiredRequestParameters = new List<InputParameter>();
            var optionalRequestParameters = new List<InputParameter>();

            var requestConditionHeaders = RequestConditionHeaders.None;
            var requestConditionSerializationFormat = SerializationFormat.Default;
            InputParameter? bodyParameter = null;
            InputParameter? contentTypeRequestParameter = null;
            InputParameter? requestConditionRequestParameter = null;

            foreach (var operationParameter in operationParameters)
            {
                switch (operationParameter)
                {
                    case { Location: RequestLocation.Body }:
                        bodyParameter = operationParameter;
                        break;
                    case { Location: RequestLocation.Header, IsContentType: true } when contentTypeRequestParameter == null:
                        contentTypeRequestParameter = operationParameter;
                        break;
                    case { Location: RequestLocation.Header } when ConditionRequestHeader.TryGetValue(operationParameter.NameInRequest, out var header):
                        if (operationParameter.IsRequired)
                        {
                            throw new NotSupportedException("Required conditional request headers are not supported.");
                        }

                        requestConditionHeaders |= header;
                        requestConditionRequestParameter ??= operationParameter;
                        requestConditionSerializationFormat = requestConditionSerializationFormat == SerializationFormat.Default
                            ? operationParameter.SerializationFormat
                            : requestConditionSerializationFormat;

                        break;
                    case { Location: RequestLocation.Uri or RequestLocation.Path }:
                        requiredPathParameters.Add(operationParameter.NameInRequest, operationParameter);
                        break;
                    case { IsApiVersion: true, DefaultValue: not null }:
                        optionalRequestParameters.Add(operationParameter);
                        break;
                    case { IsRequired: true }:
                        if (Operation.KeepClientDefaultValue && operationParameter.DefaultValue != null)
                        {
                            optionalRequestParameters.Add(operationParameter);
                        }
                        else
                        {
                            requiredRequestParameters.Add(operationParameter);
                        }
                        break;
                    default:
                        optionalRequestParameters.Add(operationParameter);
                        break;
                }
            }

            AddWaitForCompletion();
            AddUriOrPathParameters(Operation.Uri, requiredPathParameters);
            AddUriOrPathParameters(Operation.Path, requiredPathParameters);
            AddQueryOrHeaderParameters(requiredRequestParameters);
            AddBody(bodyParameter, contentTypeRequestParameter);
            AddUriOrPathParameters(Operation.Uri, optionalPathParameters);
            AddUriOrPathParameters(Operation.Path, optionalPathParameters);
            AddQueryOrHeaderParameters(optionalRequestParameters);
            AddRequestConditionHeaders(requestConditionHeaders, requestConditionRequestParameter, requestConditionSerializationFormat);
            AddRequestContext();
        }

        private void AddWaitForCompletion()
        {
            if (Operation.LongRunning != null)
            {
                _orderedParameters.Add(new ParameterChain(KnownParameters.WaitForCompletion, KnownParameters.WaitForCompletion, null, false));
            }
        }

        private void AddUriOrPathParameters(string uriPart, IReadOnlyDictionary<string, InputParameter> requestParameters)
        {
            foreach ((ReadOnlySpan<char> span, bool isLiteral) in StringExtensions.GetPathParts(uriPart))
            {
                if (isLiteral)
                {
                    continue;
                }

                var text = span.ToString();
                if (requestParameters.TryGetValue(text, out var requestParameter))
                {
                    AddParameter(text, requestParameter);
                }
            }
        }

        private void AddQueryOrHeaderParameters(IEnumerable<InputParameter> inputParameters)
        {
            foreach (var inputParameter in inputParameters)
            {
                AddParameter(inputParameter.NameInRequest, inputParameter);
            }
        }

        private void AddBody(InputParameter? bodyParameter, InputParameter? contentTypeRequestParameter)
        {
            if (bodyParameter == null)
            {
                return;
            }

            _protocolBodyParameter = bodyParameter.IsRequired
                ? KnownParameters.RequestContent
                : KnownParameters.RequestContentNullable;
            _orderedParameters.Add(new ParameterChain(BuildParameter(bodyParameter), _protocolBodyParameter, _protocolBodyParameter, bodyParameter.Kind == InputOperationParameterKind.Spread));

            if (contentTypeRequestParameter != null)
            {
                if (Operation.RequestMediaTypes?.Count > 1)
                {
                    AddContentTypeRequestParameter(contentTypeRequestParameter, Operation.RequestMediaTypes);
                }
                else
                {
                    AddParameter(contentTypeRequestParameter, typeof(ContentType));
                }
            }
        }

        public void AddRequestConditionHeaders(RequestConditionHeaders conditionHeaderFlag, InputParameter? requestConditionRequestParameter, SerializationFormat serializationFormat)
        {
            if (conditionHeaderFlag == RequestConditionHeaders.None || requestConditionRequestParameter == null)
            {
                return;
            }

            _conditionHeaderFlag = conditionHeaderFlag;

            switch (conditionHeaderFlag)
            {
                case RequestConditionHeaders.IfMatch | RequestConditionHeaders.IfNoneMatch:
                    _orderedParameters.Add(new ParameterChain(KnownParameters.MatchConditionsParameter, KnownParameters.MatchConditionsParameter, KnownParameters.MatchConditionsParameter));
                    AddReference(KnownParameters.MatchConditionsParameter.Name, null, KnownParameters.MatchConditionsParameter, serializationFormat);
                    break;
                case RequestConditionHeaders.IfMatch:
                case RequestConditionHeaders.IfNoneMatch:
                    AddParameter(requestConditionRequestParameter, typeof(ETag));
                    break;
                default:
                    _orderedParameters.Add(new ParameterChain(KnownParameters.RequestConditionsParameter, KnownParameters.RequestConditionsParameter, KnownParameters.RequestConditionsParameter));
                    AddReference(KnownParameters.RequestConditionsParameter.Name, null, KnownParameters.RequestConditionsParameter, serializationFormat);
                    break;
            }
        }

        public void AddRequestContext()
        {
            _orderedParameters.Add(new ParameterChain(
                KnownParameters.CancellationTokenParameter,
                ShouldRequestContextOptional() ? KnownParameters.RequestContext : KnownParameters.RequestContextRequired,
                KnownParameters.RequestContext));
        }

        private void AddContentTypeRequestParameter(InputParameter operationParameter, IReadOnlyList<string> requestMediaTypes)
        {
            var name = operationParameter.Name.ToVariableName();
            var description = Parameter.CreateDescription(operationParameter, typeof(ContentType), requestMediaTypes);
            var parameter = new Parameter(name, description, typeof(ContentType), null, ValidationType.None, null, RequestLocation: RequestLocation.Header);
            _orderedParameters.Add(new ParameterChain(parameter, parameter, parameter));

            AddReference(operationParameter.NameInRequest, operationParameter, parameter, SerializationFormat.Default);
        }

        private void AddParameter(InputParameter operationParameter, CSharpType? frameworkParameterType = null)
            => AddParameter(operationParameter.NameInRequest, operationParameter, frameworkParameterType);

        private void AddParameter(string name, InputParameter inputParameter, CSharpType? frameworkParameterType = null)
        {
            var protocolMethodParameter = BuildParameter(inputParameter, frameworkParameterType ?? ChangeTypeForProtocolMethod(inputParameter.Type));

            AddReference(name, inputParameter, protocolMethodParameter, inputParameter.SerializationFormat);
            if (inputParameter.Kind is InputOperationParameterKind.Client or InputOperationParameterKind.Constant)
            {
                return;
            }

            if (inputParameter.Kind == InputOperationParameterKind.Grouped)
            {
                _orderedParameters.Add(new ParameterChain(null, protocolMethodParameter, protocolMethodParameter));
                return;
            }

            var convenienceMethodParameter = BuildParameter(inputParameter, frameworkParameterType);
            var parameterChain = inputParameter.Location == RequestLocation.None
                ? new ParameterChain(convenienceMethodParameter, null, null)
                : new ParameterChain(convenienceMethodParameter, protocolMethodParameter, protocolMethodParameter);

            _orderedParameters.Add(parameterChain);
        }

        private Parameter BuildParameter(in InputParameter operationParameter, CSharpType? typeOverride = null)
        {
            var type = typeOverride != null
                ? typeOverride.WithNullable(operationParameter.Type.IsNullable)
                : _typeFactory.CreateType(operationParameter.Type);

            return Parameter.FromInputParameter(operationParameter, type, _typeFactory, Operation.KeepClientDefaultValue);
        }

        private void AddReference(string nameInRequest, InputParameter? operationParameter, Parameter parameter, SerializationFormat serializationFormat)
        {
            var reference = operationParameter != null ? CreateReference(operationParameter, parameter) : parameter;
            _requestParts.Add(new RequestPartSource(nameInRequest, operationParameter, reference, serializationFormat));
        }

        private ReferenceOrConstant CreateReference(InputParameter operationParameter, Parameter parameter)
        {
            if (operationParameter.Kind == InputOperationParameterKind.Client)
            {
                var field = operationParameter.IsEndpoint ? _fields.EndpointField : _fields.GetFieldByParameter(parameter);
                if (field == null)
                {
                    throw new InvalidOperationException($"Parameter {parameter.Name} should have matching field");
                }

                return new Reference(field.Name, field.Type);
            }

            if (operationParameter.Kind is InputOperationParameterKind.Constant && parameter.DefaultValue is not null)
            {
                return (ReferenceOrConstant)parameter.DefaultValue;
            }

            return parameter;
        }

        private CSharpType? ChangeTypeForProtocolMethod(InputType type) => type switch
        {
            InputEnumType enumType => _typeFactory.CreateType(enumType.EnumValueType).WithNullable(enumType.IsNullable),
            InputModelType modelType => new CSharpType(typeof(object), modelType.IsNullable),
            _ => null
        };

        private record ReturnTypeChain(CSharpType Convenience, CSharpType Protocol, CSharpType? ConvenienceResponseType);

        private record ParameterChain(Parameter? Convenience, Parameter? Protocol, Parameter? CreateMessage, bool IsSpreadParameter = false);

        internal record ConvenienceMethodGenerationInfo()
        {
            public bool IsConvenienceMethodGenerated { get; init; } = false;

            public bool IsConvenienceMethodInternal { get; init; } = false;

            public ConvenienceMethodOmittingMessage? Message { get; init; }
        }
    }
}
