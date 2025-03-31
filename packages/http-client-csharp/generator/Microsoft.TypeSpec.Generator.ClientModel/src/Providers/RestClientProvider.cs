// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class RestClientProvider : TypeProvider
    {
        private const string RepeatabilityRequestIdHeader = "Repeatability-Request-ID";
        private const string RepeatabilityFirstSentHeader = "Repeatability-First-Sent";
        private static readonly Dictionary<string, ParameterProvider> _knownSpecialHeaderParams = new(StringComparer.OrdinalIgnoreCase)
        {
            { RepeatabilityRequestIdHeader, ScmKnownParameters.RepeatabilityRequestId },
            { RepeatabilityFirstSentHeader, ScmKnownParameters.RepeatabilityFirstSent }
        };
        private Dictionary<InputOperation, MethodProvider>? _methodCache;
        private Dictionary<InputOperation, MethodProvider> MethodCache => _methodCache ??= [];

        private readonly Dictionary<List<int>, PropertyProvider> _pipelineMessage20xClassifiers;
        private readonly InputClient _inputClient;

        public RestClientProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            _inputClient = inputClient;
            ClientProvider = clientProvider;
            _pipelineMessage20xClassifiers = BuildPipelineMessage20xClassifiers();
        }

        internal ClientProvider ClientProvider { get; }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.RestClient.cs");

        protected override string BuildName() => _inputClient.Name.ToCleanName();

        protected override string BuildNamespace() => ClientProvider.Type.Namespace;

        protected override PropertyProvider[] BuildProperties()
        {
            return [.. _pipelineMessage20xClassifiers.Values.OrderBy(v => v.Name)];
        }

        protected override FieldProvider[] BuildFields()
        {
            List<FieldProvider> pipelineMessage20xClassifiersFields = new(_pipelineMessage20xClassifiers.Count);
            var orderedClassifierProperties = _pipelineMessage20xClassifiers.Values.OrderBy(v => v.Name);

            foreach (var classifierProperty in orderedClassifierProperties)
            {
                if (classifierProperty.BackingField != null)
                {
                    pipelineMessage20xClassifiersFields.Add(classifierProperty.BackingField);
                }
            }

            return [.. pipelineMessage20xClassifiersFields];
        }

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>();

            foreach (var operation in _inputClient.Operations)
            {
                var method = BuildCreateRequestMethod(operation);
                methods.Add(method);
                MethodCache[operation] = method;
            }

            return [.. methods];
        }

        private MethodProvider BuildCreateRequestMethod(InputOperation operation)
        {
            var pipelineField = ClientProvider.PipelineProperty.ToApi<ClientPipelineApi>();

            var options = ScmKnownParameters.RequestOptions;
            var parameters = GetMethodParameters(operation, MethodType.CreateRequest);

            var signature = new MethodSignature(
                $"Create{operation.Name.ToCleanName()}Request",
                null,
                MethodSignatureModifiers.Internal,
                ScmCodeModelGenerator.Instance.TypeFactory.HttpMessageApi.HttpMessageType,
                null,
                [.. parameters, options]);
            var paramMap = new Dictionary<string, ParameterProvider>(signature.Parameters.ToDictionary(p => p.Name));

            foreach (var param in ClientProvider.ClientParameters)
            {
                paramMap[param.Name] = param;
            }

            var classifier = GetClassifier(operation);

            return new MethodProvider(
                signature,
                new MethodBodyStatements(
                [
                    Declare("message", pipelineField.CreateMessage(options.ToApi<HttpRequestOptionsApi>(), classifier).ToApi<HttpMessageApi>(), out HttpMessageApi message),
                    message.ApplyResponseClassifier(classifier.ToApi<StatusCodeClassifierApi>()),
                    Declare("request", message.Request().ToApi<HttpRequestApi>(), out HttpRequestApi request),
                    request.SetMethod(operation.HttpMethod),
                    Declare("uri", New.Instance(request.UriBuilderType), out ScopedApi uri),
                    operation.Paging?.NextLink != null ?
                        uri.Reset(ScmKnownParameters.NextPage.AsExpression().NullCoalesce(ClientProvider.EndpointField)).Terminate() :
                        uri.Reset(ClientProvider.EndpointField).Terminate(),
                    .. ConditionallyAppendPathParameters(operation, uri, paramMap),
                    .. AppendQueryParameters(uri, operation, paramMap),
                    request.SetUri(uri),
                    .. AppendHeaderParameters(request, operation, paramMap),
                    .. GetSetContent(request, signature.Parameters),
                    message.ApplyRequestOptions(options.ToApi<HttpRequestOptionsApi>()),
                    Return(message)
                ]),
                this);
        }

        private IReadOnlyList<MethodBodyStatement> ConditionallyAppendPathParameters(InputOperation operation, ScopedApi uri, Dictionary<string, ParameterProvider> paramMap)
        {
            if (operation.Paging?.NextLink != null)
            {
                return
                [
                    new IfStatement(ScmKnownParameters.NextPage.Equal(Null))
                    {
                        new MethodBodyStatements([..AppendPathParameters(uri, operation, paramMap)])
                    }
                ];
            }

            return AppendPathParameters(uri, operation, paramMap);
        }

        private IReadOnlyList<MethodBodyStatement> GetSetContent(HttpRequestApi request, IReadOnlyList<ParameterProvider> parameters)
        {
            var contentParam = parameters.FirstOrDefault(
                p => ReferenceEquals(p, ScmKnownParameters.RequestContent) || ReferenceEquals(p, ScmKnownParameters.OptionalRequestContent));
            return contentParam is null ? [] : [request.Content().Assign(contentParam).Terminate()];
        }

        private Dictionary<List<int>, PropertyProvider> BuildPipelineMessage20xClassifiers()
        {
            // Contains a mapping of classifier status codes to their corresponding pipeline message classifier property
            Dictionary<List<int>, PropertyProvider> classifiers = new(new StatusCodesComparer());

            foreach (var inputOperation in _inputClient.Operations)
            {
                var statusCodes = GetSuccessStatusCodes(inputOperation);
                if (statusCodes.Count > 0 && !classifiers.ContainsKey(statusCodes))
                {
                    var classifierNameSuffix = string.Join(string.Empty, statusCodes);
                    var classifierBackingField = new FieldProvider(
                        FieldModifiers.Private | FieldModifiers.Static,
                        ScmCodeModelGenerator.Instance.TypeFactory.StatusCodeClassifierApi.ResponseClassifierType,
                        $"_pipelineMessageClassifier{classifierNameSuffix}",
                        this);

                    var classifierProperty = new PropertyProvider(
                        null,
                        MethodSignatureModifiers.Private | MethodSignatureModifiers.Static,
                        ScmCodeModelGenerator.Instance.TypeFactory.StatusCodeClassifierApi.ResponseClassifierType,
                        classifierBackingField.Name.Substring(1).ToCleanName(),
                        new ExpressionPropertyBody(
                            classifierBackingField.Assign(This.ToApi<StatusCodeClassifierApi>().Create(GetSuccessStatusCodes(inputOperation)))),
                        this)
                    {
                        BackingField = classifierBackingField
                    };

                    classifiers[statusCodes] = classifierProperty;
                }
            }

            return classifiers;
        }

        private PropertyProvider GetClassifier(InputOperation operation)
        {
            if (_pipelineMessage20xClassifiers.TryGetValue(GetSuccessStatusCodes(operation), out var classifier))
            {
                return classifier;
            }

            throw new InvalidOperationException($"Unexpected status codes for operation {operation.Name}");
        }

        private IEnumerable<MethodBodyStatement> AppendHeaderParameters(HttpRequestApi request, InputOperation operation, Dictionary<string, ParameterProvider> paramMap)
        {
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);

            foreach (var inputParameter in operation.Parameters)
            {
                if (inputParameter.Location != InputRequestLocation.Header)
                    continue;

                CSharpType? type;
                string? format;
                ValueExpression valueExpression;
                GetParamInfo(paramMap, operation, inputParameter, out type, out format, out valueExpression);
                var convertToStringExpression = TypeFormattersSnippets.ConvertToString(valueExpression, Literal(format));
                ValueExpression toStringExpression = type?.Equals(typeof(string)) == true ? valueExpression : convertToStringExpression;
                MethodBodyStatement statement;
                if (type?.IsCollection == true)
                {
                    statement = request.SetHeaderDelimited(inputParameter.NameInRequest, valueExpression, Literal(inputParameter.ArraySerializationDelimiter), format != null ? Literal(format) : null);
                }
                else
                {
                    statement = request.SetHeaders([Literal(inputParameter.NameInRequest), toStringExpression.As<string>()]);
                }
                statements.Add(statement);
            }

            return statements;
        }

        private static List<MethodBodyStatement> AppendQueryParameters(ScopedApi uri, InputOperation operation, Dictionary<string, ParameterProvider> paramMap)
        {
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);

            foreach (var inputParameter in operation.Parameters)
            {
                if (inputParameter.Location != InputRequestLocation.Query)
                    continue;

                string? format;
                ValueExpression valueExpression;
                GetParamInfo(paramMap, operation, inputParameter, out var paramType, out format, out valueExpression);
                var convertToStringExpression = TypeFormattersSnippets.ConvertToString(valueExpression, Literal(format));
                ValueExpression toStringExpression = paramType?.Equals(typeof(string)) == true ? valueExpression : convertToStringExpression;
                MethodBodyStatement statement;

                if (paramType?.IsCollection == true)
                {
                    var delimiter = inputParameter.ArraySerializationDelimiter;

                    if (inputParameter.Type is InputDictionaryType)
                    {
                        if (inputParameter.Explode)
                        {
                            statement = new ForeachStatement("param", valueExpression.AsDictionary(paramType),
                                out KeyValuePairExpression item)
                            {
                                uri.AppendQuery(item.Key, item.Value, true).Terminate()
                            };
                        }
                        else
                        {
                            statement = new[]
                            {
                                Declare("list", New.List<object>(), out var list),
                                new ForeachStatement("param", valueExpression.AsDictionary(paramType), out KeyValuePairExpression item)
                                {
                                    list.Add(item.Key),
                                    list.Add(item.Value)
                                },
                                uri.AppendQueryDelimited(Literal(inputParameter.NameInRequest), list, format, true)
                                    .Terminate()
                            };
                        }
                    }
                    else if (!inputParameter.Explode)
                    {
                        statement = uri.AppendQueryDelimited(Literal(inputParameter.NameInRequest), valueExpression, format, true, delimiter: delimiter).Terminate();
                    }
                    else
                    {
                        statement = new ForeachStatement("param", valueExpression.As(paramType), out VariableExpression item)
                        {
                            uri.AppendQuery(Literal(inputParameter.NameInRequest), item, true).Terminate()
                        };
                    }
                }
                else
                {
                    statement = uri.AppendQuery(Literal(inputParameter.NameInRequest), toStringExpression, true)
                        .Terminate();
                }

                if (!inputParameter.IsRequired || paramType?.IsNullable == true ||
                    (paramType is { IsValueType: false, IsFrameworkType: true } && paramType.FrameworkType != typeof(string)))
                {
                    statement = BuildQueryParameterNullCheck(paramType, valueExpression, statement);
                }

                statements.Add(statement);
            }

            return statements;
        }

        private static IfStatement BuildQueryParameterNullCheck(
            CSharpType? parameterType,
            ValueExpression valueExpression,
            MethodBodyStatement originalStatement)
        {
            if (parameterType?.IsCollection == true)
            {
                DeclarationExpression? changeTrackingCollectionDeclaration;
                VariableExpression? changeTrackingReference;
                if (parameterType.IsDictionary)
                {
                    changeTrackingCollectionDeclaration = Declare(
                        "changeTrackingDictionary",
                        ScmCodeModelGenerator.Instance.TypeFactory.DictionaryInitializationType.MakeGenericType(parameterType.Arguments),
                        out changeTrackingReference);
                }
                else
                {
                    changeTrackingCollectionDeclaration = Declare(
                        "changeTrackingList",
                        ScmCodeModelGenerator.Instance.TypeFactory.ListInitializationType.MakeGenericType(parameterType
                            .Arguments),
                        out changeTrackingReference);
                }

                return new IfStatement(valueExpression.NotEqual(Null)
                    .And(Not(valueExpression.Is(changeTrackingCollectionDeclaration)
                    .And(changeTrackingReference.Property("IsUndefined")))))
                {
                    originalStatement
                };
            }

            return new IfStatement(valueExpression.NotEqual(Null)) { originalStatement };
        }

        private IReadOnlyList<MethodBodyStatement> AppendPathParameters(ScopedApi uri, InputOperation operation, Dictionary<string, ParameterProvider> paramMap)
        {
            Dictionary<string, InputParameter> inputParamHash = new(operation.Parameters.ToDictionary(p => p.Name));
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);
            string? endpoint = ClientProvider.EndpointParameterName;
            int uriOffset = endpoint is null || !operation.Uri.StartsWith(endpoint, StringComparison.Ordinal) ? 0 : endpoint.Length;
            AddUriSegments(operation.Uri, uriOffset, uri, statements, inputParamHash, paramMap, operation);
            AddUriSegments(operation.Path, 0, uri, statements, inputParamHash, paramMap, operation);
            return statements;
        }

        private void AddUriSegments(
            string segments,
            int offset,
            ScopedApi uri,
            List<MethodBodyStatement> statements,
            Dictionary<string, InputParameter> inputParamHash,
            Dictionary<string, ParameterProvider> paramMap,
            InputOperation operation)
        {
            var pathSpan = segments.AsSpan().Slice(offset);
            while (pathSpan.Length > 0)
            {
                var paramIndex = pathSpan.IndexOf('{');
                if (paramIndex < 0)
                {
                    statements.Add(uri.AppendPath(Literal(pathSpan.ToString()), false).Terminate());
                    break;
                }

                statements.Add(uri.AppendPath(Literal(pathSpan.Slice(0, paramIndex).ToString()), false).Terminate());
                pathSpan = pathSpan.Slice(paramIndex + 1);
                var paramEndIndex = pathSpan.IndexOf('}');
                var paramName = pathSpan.Slice(0, paramEndIndex).ToString();
                /* when the parameter is in operation.uri, it is client parameter
                 * It is not operation parameter and not in inputParamHash list.
                 */
                var isClientParameter = ClientProvider.ClientParameters.Any(p => p.Name == paramName);
                CSharpType? type;
                string? format;
                ValueExpression valueExpression;
                InputParameter? inputParam = null;
                if (isClientParameter)
                {
                    GetParamInfo(paramMap[paramName], out type, out format, out valueExpression);
                }
                else
                {
                    inputParam = inputParamHash[paramName];
                    if (inputParam.Location == InputRequestLocation.Path || inputParam.Location == InputRequestLocation.Uri)
                    {
                        GetParamInfo(paramMap, operation, inputParam, out type, out format, out valueExpression);
                    }
                    else
                    {
                        throw new InvalidOperationException($"The location of parameter {inputParam.Name} should be path or uri");
                    }
                }
                ValueExpression[] toStringParams = format is null ? [] : [Literal(format)];
                bool escape = !inputParam?.SkipUrlEncoding ?? true;
                if (type?.OutputType.IsCollection == true)
                {
                    statements.Add(uri.AppendPathDelimited(
                        valueExpression, format, escape, inputParam?.ArraySerializationDelimiter).Terminate());
                }
                else
                {
                    valueExpression = type?.Equals(typeof(string)) == true
                        ? valueExpression
                        : valueExpression.Invoke(nameof(ToString), toStringParams);
                    statements.Add(uri.AppendPath(valueExpression, escape).Terminate());
                }

                pathSpan = pathSpan.Slice(paramEndIndex + 1);
            }
        }

        private static void GetParamInfo(Dictionary<string, ParameterProvider> paramMap, InputOperation operation, InputParameter inputParam, out CSharpType? type, out string? format, out ValueExpression valueExpression)
        {
            type = ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(inputParam.Type);
            if (inputParam.Kind == InputOperationParameterKind.Constant && !(operation.IsMultipartFormData && inputParam.IsContentType))
            {
                valueExpression = Literal((inputParam.Type as InputLiteralType)?.Value);
                format = ScmCodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputParam.Type).ToFormatSpecifier();
            }
            else if (TryGetSpecialHeaderParam(inputParam, out var parameterProvider))
            {
                valueExpression = parameterProvider.DefaultValue!;
                format = ScmCodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputParam.Type).ToFormatSpecifier();
            }
            else
            {
                var paramProvider = paramMap[inputParam.Name];
                GetParamInfo(paramProvider, out type, out format, out valueExpression);
            }
        }

        private static void GetParamInfo(ParameterProvider paramProvider, out CSharpType? type, out string? format, out ValueExpression valueExpression)
        {
            type = paramProvider.Field is null ? paramProvider.Type : paramProvider.Field.Type;
            if (type.IsEnum)
            {
                valueExpression = type.ToSerial(paramProvider);
                format = null;
            }
            else
            {
                valueExpression = paramProvider.Field is null ? paramProvider : paramProvider.Field;
                format = paramProvider.WireInfo.SerializationFormat.ToFormatSpecifier();
            }
        }

        private static IReadOnlyList<ParameterProvider> BuildSpreadParametersForModel(InputModelType inputModel)
        {
            var builtParameters = new ParameterProvider[inputModel.Properties.Count];

            int index = 0;
            foreach (var property in inputModel.Properties)
            {
                // convert the property to a parameter
                var inputParameter = new InputParameter(
                    property.Name,
                    property.SerializationOptions.Json?.Name ?? property.Name,
                    property.Summary,
                    property.Doc,
                    property.Type,
                    InputRequestLocation.Body,
                    null,
                    InputOperationParameterKind.Method,
                    property.IsRequired,
                    false,
                    false,
                    false,
                    false,
                    false,
                    null,
                    null);

                var paramProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateParameter(inputParameter).ToPublicInputParameter();
                paramProvider.DefaultValue = !inputParameter.IsRequired ? Default : null;
                paramProvider.SpreadSource = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);

                builtParameters[index++] = paramProvider;
            }

            return builtParameters;
        }

        private static bool TryGetSpecialHeaderParam(InputParameter inputParameter, [NotNullWhen(true)] out ParameterProvider? parameterProvider)
        {
            if (inputParameter.Location == InputRequestLocation.Header)
            {
                return _knownSpecialHeaderParams.TryGetValue(inputParameter.NameInRequest, out parameterProvider);
            }

            parameterProvider = null;
            return false;
        }

        private static List<int> GetSuccessStatusCodes(InputOperation operation)
        {
            HashSet<int> statusCodes = [];
            foreach (var response in operation.Responses)
            {
                if (response.IsErrorResponse)
                    continue;

                foreach (var statusCode in response.StatusCodes)
                {
                    if (statusCode >= 200 && statusCode < 300)
                    {
                        statusCodes.Add(statusCode);
                    }
                }
            }

            return [.. statusCodes.OrderBy(i => i)];
        }

        internal MethodProvider GetCreateRequestMethod(InputOperation operation)
        {
            _ = Methods; // Ensure methods are built
            return MethodCache[operation];
        }

        internal static List<ParameterProvider> GetMethodParameters(InputOperation operation, MethodType methodType)
        {
            SortedList<int, ParameterProvider> sortedParams = [];
            int paging = 0;
            int path = 1;
            int required = 100;
            int bodyRequired = 200;
            int bodyOptional = 300;
            int optional = 400;

            foreach (InputParameter inputParam in operation.Parameters)
            {
                if ((inputParam.Kind != InputOperationParameterKind.Method &&
                     inputParam.Kind != InputOperationParameterKind.Spread) ||
                    TryGetSpecialHeaderParam(inputParam, out _))
                {
                    continue;
                }

                var spreadInputModel = inputParam.Kind == InputOperationParameterKind.Spread ? GetSpreadParameterModel(inputParam) : null;

                ParameterProvider? parameter = ScmCodeModelGenerator.Instance.TypeFactory.CreateParameter(inputParam).ToPublicInputParameter();

                if (methodType is MethodType.Protocol or MethodType.CreateRequest)
                {
                    if (inputParam.Location == InputRequestLocation.Body)
                    {
                        if (methodType == MethodType.CreateRequest)
                        {
                            parameter = ScmKnownParameters.RequestContent;
                        }
                        else
                        {
                            parameter = parameter.DefaultValue == null
                                ? ScmKnownParameters.RequestContent
                                : ScmKnownParameters.OptionalRequestContent;
                        }
                    }
                    else
                    {
                        parameter.Type = parameter.Type.IsEnum ? parameter.Type.UnderlyingEnumType : parameter.Type;
                    }
                }
                else if (spreadInputModel != null)
                {
                    foreach (var bodyParam in BuildSpreadParametersForModel(spreadInputModel))
                    {
                        if (bodyParam.DefaultValue is null)
                        {
                            sortedParams.Add(bodyRequired++, bodyParam);
                        }
                        else
                        {
                            sortedParams.Add(bodyOptional++, bodyParam);
                        }
                    }
                    continue;
                }

                if (parameter is null)
                    continue;

                switch (parameter.Location)
                {
                    case ParameterLocation.Path:
                    case ParameterLocation.Uri:
                        sortedParams.Add(path++, parameter);
                        break;
                    case ParameterLocation.Query:
                    case ParameterLocation.Header:
                        if (parameter.DefaultValue == null)
                        {
                            sortedParams.Add(required++, parameter);
                        }
                        else
                        {
                            sortedParams.Add(optional++, parameter);
                        }
                        break;
                    case ParameterLocation.Body:
                        sortedParams.Add(parameter.DefaultValue == null ? bodyRequired++ : bodyOptional++, parameter);
                        break;
                    default:
                        sortedParams.Add(optional++, parameter);
                        break;
                }
            }

            if (operation.IsMultipartFormData)
            {
                sortedParams.Add(bodyRequired++, ScmKnownParameters.ContentType);
            }

            if (methodType == MethodType.CreateRequest)
            {
                // All the parameters should be required for the CreateRequest method
                foreach (var parameter in sortedParams.Values)
                {
                    parameter.DefaultValue = null;
                }

                if (operation.Paging?.NextLink != null)
                {
                    // Next link operations will always have an endpoint parameter in the CreateRequest method
                    sortedParams.Add(paging, ScmKnownParameters.NextPage);
                }
            }

            return [.. sortedParams.Values];
        }

        internal static InputModelType GetSpreadParameterModel(InputParameter inputParam)
        {
            if (inputParam.Kind.HasFlag(InputOperationParameterKind.Spread) && inputParam.Type is InputModelType model)
            {
                return model;
            }

            throw new InvalidOperationException($"inputParam `{inputParam.Name}` is `Spread` but not a model type");
        }

        internal enum MethodType
        {
            CreateRequest,
            Protocol,
            Convenience
        }

        private class StatusCodesComparer : IEqualityComparer<List<int>>
        {
            bool IEqualityComparer<List<int>>.Equals(List<int>? x, List<int>? y)
            {
                return x != null && y != null && x.SequenceEqual(y);
            }

            int IEqualityComparer<List<int>>.GetHashCode(List<int> obj)
            {
                HashCode hash = new();
                foreach (var item in obj)
                {
                    hash.Add(item);
                }
                return hash.ToHashCode();
            }
        }
    }
}
